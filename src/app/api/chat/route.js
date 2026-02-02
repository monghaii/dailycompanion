import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

const LIFE_COACH_SYSTEM_PROMPT = `You are a compassionate and insightful life coach. Your role is to:

1. **Listen deeply** - Pay attention to what the user shares and acknowledge their feelings
2. **Ask powerful questions** - Help users discover their own insights through thoughtful questions
3. **Provide guidance** - Offer practical advice and frameworks when appropriate
4. **Encourage growth** - Challenge users gently to step outside their comfort zone
5. **Stay positive** - Focus on possibilities and strengths while acknowledging challenges

Your coaching style:
- Use open-ended questions to help users reflect (e.g., "What would success look like for you?", "What's holding you back?")
- Validate their experiences before offering advice
- Share relevant frameworks or techniques (goal-setting, habit formation, mindfulness, etc.)
- Be warm, supportive, but also direct when needed
- Help users break down big goals into actionable steps
- Celebrate progress and small wins

Areas you can help with:
- Goal setting and achievement
- Building better habits
- Work-life balance
- Relationships and communication
- Confidence and self-esteem
- Career transitions
- Stress management
- Personal growth and self-discovery

Keep responses conversational, concise (2-4 paragraphs), and always end with either:
- A reflective question to deepen their thinking
- An actionable suggestion they can try today
- An invitation to share more about what they're experiencing

Remember: You're here to empower them to find their own answers, not to fix their problems for them.`;

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!CLAUDE_API_KEY) {
      return NextResponse.json(
        { error: "Claude API key not configured" },
        { status: 500 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Get current user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's token usage and coach subscription
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("token_usage, token_usage_reset_date, token_limit, coach_id, role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    // Check if user is premium (for regular users only, coaches bypass)
    if (profile.role === "user") {
      const { data: subscription } = await supabase
        .from("user_subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!subscription) {
        return NextResponse.json(
          { error: "Premium subscription required to use AI coach" },
          { status: 403 }
        );
      }
    }

    // Get coach's custom system prompt if user has a coach
    let systemPrompt = LIFE_COACH_SYSTEM_PROMPT;
    if (profile.coach_id) {
      const { data: coachConfig, error: configError } = await supabase
        .from("coach_configs")
        .select("config")
        .eq("coach_id", profile.coach_id)
        .single();

      if (!configError && coachConfig?.config?.coach_tab?.system_prompt) {
        systemPrompt = coachConfig.config.coach_tab.system_prompt;
      }
    }

    // Check if token usage should be reset (new month)
    const lastReset = new Date(profile.token_usage_reset_date);
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    let currentUsage = profile.token_usage;

    if (lastReset < currentMonthStart) {
      // Reset token usage for new month
      const { error: resetError } = await supabase
        .from("profiles")
        .update({
          token_usage: 0,
          token_usage_reset_date: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (resetError) {
        console.error("Error resetting token usage:", resetError);
      } else {
        currentUsage = 0;
      }
    }

    // Check if user has exceeded token limit
    const tokenLimit = profile.token_limit || 1000000;
    if (currentUsage >= tokenLimit) {
      return NextResponse.json(
        {
          error: "Token limit exceeded",
          message:
            "I'm sorry, you have exhausted your AI coach usage for this month. Your usage will reset at the beginning of next month.",
        },
        { status: 429 }
      );
    }

    // Call Claude API
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Claude API error:", errorData);
      return NextResponse.json(
        { error: "Failed to get response from Claude API" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Track token usage from Claude API response
    const tokensUsed =
      (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

    if (tokensUsed > 0) {
      // Update user's token usage
      const newUsage = currentUsage + tokensUsed;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ token_usage: newUsage })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating token usage:", updateError);
      }
    }

    const tokensRemaining = tokenLimit - (currentUsage + tokensUsed);
    const usagePercentage = ((currentUsage + tokensUsed) / tokenLimit) * 100;

    // Add usage warnings
    let warning = null;
    if (usagePercentage >= 90) {
      warning = {
        level: "high",
        message: `⚠️ You're approaching your monthly AI coach limit. Your usage will reset at the beginning of next month.`,
      };
    } else if (usagePercentage >= 50) {
      warning = {
        level: "medium",
        message: `📊 You've used over half of your monthly AI coach limit. Your usage will reset at the beginning of next month. Plan accordingly!`,
      };
    }

    return NextResponse.json({
      message: data.content[0].text,
      tokensUsed: tokensUsed,
      tokensRemaining: tokensRemaining,
      usagePercentage: usagePercentage.toFixed(1),
      warning: warning,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
