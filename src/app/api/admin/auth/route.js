import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const { password } = await request.json();

    const adminPw = process.env.ADMIN_PW;
    if (!adminPw) {
      return Response.json({ error: "Admin password not configured" }, { status: 500 });
    }

    if (password !== adminPw) {
      return Response.json({ error: "Invalid password" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set("admin_session", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Authentication failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  return Response.json({ success: true });
}
