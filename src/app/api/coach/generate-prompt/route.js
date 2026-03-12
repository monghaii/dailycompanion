import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req) {
  try {
    const { credentials, openSession, closeSession } = await req.json();

    if (!process.env.CLAUDE_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });

    const prompt = `You are an expert AI prompt engineer. Your task is to create a system prompt for an AI coach based on the following details provided by the human coach:

1.  **Credentials & Training**: ${credentials}
2.  **How they open a session**: ${openSession}
3.  **How they close a session**: ${closeSession}

Using this information, generate a comprehensive system prompt for an AI assistant that embodies this coach's persona, style, and methodology.

The system prompt should include:
-   **Role**: Define the AI as a supportive, insightful coach with the specified background.
-   **Tone & Style**: Match the tone implied by their opening and closing examples (e.g., warm, direct, formal, casual).
-   **Key Behaviors**:
    -   Use the specific opening techniques/questions provided to start conversations.
    -   Use the specific closing techniques/phrases provided to wrap up conversations.
    -   Integrate their specific modalities/training into how they offer advice and ask questions.
-   **Guidelines**:
    -   Listen deeply and validate feelings.
    -   Ask powerful questions.
    -   Keep responses conversational and concise (2-4 paragraphs).
    -   Always end with a reflective question, actionable suggestion, or invitation to share more.

**Output Format**:
Return ONLY the generated system prompt text. Do not include any introductory or concluding remarks.`;

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      temperature: 0.7,
      system: "You are a helpful assistant that generates system prompts for AI personas.",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const generatedPrompt = msg.content[0].text;

    return NextResponse.json({ prompt: generatedPrompt });
  } catch (error) {
    console.error("Error generating prompt:", error);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 }
    );
  }
}
