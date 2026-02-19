import { getCurrentUser } from "@/lib/auth";
import { testKitConnection } from "@/lib/kit";

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { apiKey } = await request.json();

    if (!apiKey) {
      return Response.json({ error: "API key is required" }, { status: 400 });
    }

    const result = await testKitConnection(apiKey);

    return Response.json(result);
  } catch (error) {
    console.error("Kit test error:", error);
    return Response.json(
      {
        success: false,
        error: error.message || "Failed to test Kit connection",
      },
      { status: 500 },
    );
  }
}
