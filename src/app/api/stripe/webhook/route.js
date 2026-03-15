import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { syncUserToKit } from "@/lib/kit-sync";
import { trackServerEvent, identifyUser } from "@/lib/posthog";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    let event;

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 400 },
        );
      }
    } else {
      // For development without webhook secret
      event = JSON.parse(body);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        if (session.metadata?.type === "coach_subscription") {
          // Coach subscribed to platform
          const updateData = {
            platform_subscription_status: "active",
            platform_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            is_active: true,
          };

          // If this checkout included setup fee, mark it as paid
          if (session.metadata.includesSetupFee === "true") {
            updateData.setup_fee_paid = true;
            updateData.setup_fee_paid_at = new Date().toISOString();

            // Calculate setup fee amount from line items
            const lineItems = await stripe.checkout.sessions.listLineItems(
              session.id,
            );
            const setupFeeItem = lineItems.data.find(
              (item) =>
                item.description?.includes("Setup Fee") ||
                item.price?.product?.name?.includes("Setup Fee"),
            );

            if (setupFeeItem) {
              updateData.setup_fee_amount_cents = setupFeeItem.amount_total;
            }
          }

          await supabase
            .from("coaches")
            .update(updateData)
            .eq("id", session.metadata.coachId);

          console.log(
            `[Webhook] Coach subscription activated: ${session.metadata.coachId}`,
          );

          trackServerEvent(session.metadata.coachId, "subscription_activated", {
            type: "coach",
            includes_setup_fee: session.metadata.includesSetupFee === "true",
          });
          identifyUser(session.metadata.coachId, {
            platform_subscription_status: "active",
            subscription_start_date: new Date().toISOString(),
          });
        } else if (session.metadata?.type === "coach_sponsorship") {
          // Coach completed checkout to sponsor their first user at a tier
          const coachId = session.metadata.coach_id;
          const tier = parseInt(session.metadata.subscription_tier);
          const userId = session.metadata.user_id;
          const feePerUserCents = parseInt(session.metadata.fee_per_user_cents);

          // Create/update the coach_sponsorships record
          await supabase.from("coach_sponsorships").upsert(
            {
              coach_id: coachId,
              subscription_tier: tier,
              stripe_subscription_id: session.subscription,
              stripe_customer_id: session.customer,
              status: "active",
              quantity: 1,
              fee_per_user_cents: feePerUserCents,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "coach_id,subscription_tier" },
          );

          // Create the sponsored user's subscription record
          await supabase.from("user_subscriptions").upsert({
            user_id: userId,
            coach_id: coachId,
            status: "active",
            subscription_tier: tier,
            billing_interval: "monthly",
            price_cents: 0,
            sponsored_by_coach_id: coachId,
            current_period_start: new Date().toISOString(),
          });

          console.log(
            `[Webhook] Sponsorship activated: coach=${coachId}, user=${userId}, tier=${tier}`,
          );

          trackServerEvent(coachId, "sponsorship_created", {
            tier,
            user_id: userId,
            fee_per_user_cents: feePerUserCents,
          });
        } else if (session.metadata?.type === "user_subscription") {
          // User subscribed to coach
          const subscriptionData = {
            user_id: session.metadata.userId,
            coach_id: session.metadata.coachId,
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            status: "active",
            current_period_start: new Date().toISOString(),
            subscription_tier:
              parseInt(session.metadata.subscription_tier) || 2,
            billing_interval: session.metadata.billing_interval || "monthly",
            price_cents:
              parseInt(session.metadata.price_cents) ||
              (parseInt(session.metadata.subscription_tier) === 3
                ? 1999
                : 999),
          };

          await supabase.from("user_subscriptions").upsert(subscriptionData);

          console.log(
            `[Webhook] User subscription activated: user=${session.metadata.userId}, coach=${session.metadata.coachId}, tier=${subscriptionData.subscription_tier}`,
          );

          trackServerEvent(session.metadata.userId, "subscription_activated", {
            type: "user",
            coach_id: session.metadata.coachId,
            tier: subscriptionData.subscription_tier,
            interval: subscriptionData.billing_interval,
            price_cents: subscriptionData.price_cents,
            currency: session.metadata.currency || "usd",
          });
          identifyUser(session.metadata.userId, {
            subscription_tier: subscriptionData.subscription_tier,
            subscription_status: "active",
            subscription_start_date: new Date().toISOString(),
            billing_interval: subscriptionData.billing_interval,
            price_cents: subscriptionData.price_cents,
          });

          // Sync user to Kit (ConvertKit) if coach has it enabled
          try {
            // Get user details for Kit sync
            const { data: user } = await supabase
              .from("profiles")
              .select("email, first_name, last_name")
              .eq("id", session.metadata.userId)
              .single();

            if (user) {
              await syncUserToKit({
                userId: session.metadata.userId,
                coachId: session.metadata.coachId,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                subscriptionStatus: "active",
              });
              console.log(
                `[Webhook] Kit sync initiated for user: ${session.metadata.userId}`,
              );
            }
          } catch (kitError) {
            // Don't fail the webhook if Kit sync fails
            console.error("[Webhook] Kit sync error:", kitError);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;

        // Check if it's a sponsorship subscription
        const { data: sponsorshipRecord } = await supabase
          .from("coach_sponsorships")
          .select("id, coach_id, subscription_tier")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (sponsorshipRecord) {
          const newStatus = subscription.status === "active" ? "active"
            : subscription.status === "past_due" ? "past_due"
            : "canceled";

          await supabase
            .from("coach_sponsorships")
            .update({
              status: newStatus,
              quantity: subscription.items?.data?.[0]?.quantity || 0,
              updated_at: new Date().toISOString(),
            })
            .eq("id", sponsorshipRecord.id);

          console.log(
            `[Webhook] Sponsorship updated: coach=${sponsorshipRecord.coach_id}, tier=${sponsorshipRecord.subscription_tier}, status=${newStatus}`,
          );
          break;
        }

        // Check if it's a coach platform subscription
        const { data: coach } = await supabase
          .from("coaches")
          .select("id")
          .eq("platform_subscription_id", subscription.id)
          .single();

        if (coach) {
          await supabase
            .from("coaches")
            .update({
              platform_subscription_status: subscription.status,
              platform_subscription_ends_at: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
              is_active: subscription.status === "active",
            })
            .eq("id", coach.id);

          console.log(
            `[Webhook] Coach subscription updated: ${coach.id}, status=${subscription.status}`,
          );

          trackServerEvent(coach.id, "subscription_updated", {
            type: "coach",
            status: subscription.status,
          });
        } else {
          // Update user subscription status
          await supabase
            .from("user_subscriptions")
            .update({
              status: subscription.status,
              current_period_start: subscription.current_period_start
                ? new Date(
                    subscription.current_period_start * 1000,
                  ).toISOString()
                : null,
              current_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
            })
            .eq("stripe_subscription_id", subscription.id);

          console.log(
            `[Webhook] User subscription updated: ${subscription.id}, status=${subscription.status}`,
          );

          const { data: updatedSub } = await supabase
            .from("user_subscriptions")
            .select("user_id, coach_id")
            .eq("stripe_subscription_id", subscription.id)
            .single();

          if (updatedSub) {
            trackServerEvent(updatedSub.user_id, "subscription_updated", {
              type: "user",
              status: subscription.status,
              coach_id: updatedSub.coach_id,
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        // Check if it's a sponsorship subscription
        const { data: deletedSponsorship } = await supabase
          .from("coach_sponsorships")
          .select("id, coach_id, subscription_tier")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (deletedSponsorship) {
          await supabase
            .from("coach_sponsorships")
            .update({ status: "canceled", quantity: 0, updated_at: new Date().toISOString() })
            .eq("id", deletedSponsorship.id);

          // Cancel all sponsored user subscriptions for this tier
          await supabase
            .from("user_subscriptions")
            .update({
              status: "canceled",
              canceled_at: new Date().toISOString(),
            })
            .eq("sponsored_by_coach_id", deletedSponsorship.coach_id)
            .eq("subscription_tier", deletedSponsorship.subscription_tier)
            .eq("status", "active");

          console.log(
            `[Webhook] Sponsorship canceled: coach=${deletedSponsorship.coach_id}, tier=${deletedSponsorship.subscription_tier}`,
          );

          trackServerEvent(deletedSponsorship.coach_id, "sponsorship_canceled", {
            tier: deletedSponsorship.subscription_tier,
          });
          break;
        }

        // Check if it's a coach subscription
        const { data: coach } = await supabase
          .from("coaches")
          .select("id")
          .eq("platform_subscription_id", subscription.id)
          .single();

        if (coach) {
          await supabase
            .from("coaches")
            .update({
              platform_subscription_status: "canceled",
              is_active: false,
            })
            .eq("id", coach.id);

          console.log(`[Webhook] Coach subscription canceled: ${coach.id}`);

          trackServerEvent(coach.id, "subscription_canceled", {
            type: "coach",
          });
          identifyUser(coach.id, {
            platform_subscription_status: "canceled",
            churned_at: new Date().toISOString(),
          });
        } else {
          const { data: canceledSub } = await supabase
            .from("user_subscriptions")
            .select("user_id, coach_id, subscription_tier")
            .eq("stripe_subscription_id", subscription.id)
            .single();

          await supabase
            .from("user_subscriptions")
            .update({
              status: "canceled",
              canceled_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);

          console.log(
            `[Webhook] User subscription canceled: ${subscription.id}`,
          );

          if (canceledSub) {
            trackServerEvent(canceledSub.user_id, "subscription_canceled", {
              type: "user",
              coach_id: canceledSub.coach_id,
              tier: canceledSub.subscription_tier,
            });
            identifyUser(canceledSub.user_id, {
              subscription_status: "canceled",
              churned_at: new Date().toISOString(),
            });
          }
        }
        break;
      }

      case "account.updated": {
        // Stripe Connect account updated
        const account = event.data.object;

        if (account.metadata?.coachId) {
          const isActive = account.charges_enabled && account.payouts_enabled;

          await supabase
            .from("coaches")
            .update({
              stripe_account_status: isActive ? "active" : "pending",
            })
            .eq("id", account.metadata.coachId);

          console.log(
            `[Webhook] Connect account updated: ${account.metadata.coachId}, active=${isActive}`,
          );
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
