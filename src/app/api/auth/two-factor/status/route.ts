import { requireSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireSessionUser();

    return Response.json({
      enabled: user.twoFactorEnabled,
      pendingSetup: !user.twoFactorEnabled && Boolean(user.twoFactorTempSecret),
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return Response.json({ error: "Рұқсат жоқ" }, { status: 403 });
    }

    return Response.json({ error: "Сервер қатесі" }, { status: 500 });
  }
}
