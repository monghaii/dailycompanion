import { cookies } from "next/headers";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (session?.value !== "1") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
