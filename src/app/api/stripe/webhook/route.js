import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { syncUserToKit } from "@/lib/kit-sync";

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
        } else if (session.metadata?.type === "user_subscription") {
          // User subscribed to coach
          await supabase.from("user_subscriptions").upsert({
            user_id: session.metadata.userId,
            coach_id: session.metadata.coachId,
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            status: "active",
            current_period_start: new Date().toISOString(),
          });

          console.log(
            `[Webhook] User subscription activated: user=${session.metadata.userId}, coach=${session.metadata.coachId}`,
          );

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

        // Check if it's a coach or user subscription
        const { data: coach } = await supabase
          .from("coaches")
          .select("id")
          .eq("platform_subscription_id", subscription.id)
          .single();

        if (coach) {
          // Update coach subscription status
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
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

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
        } else {
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
