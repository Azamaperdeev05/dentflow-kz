import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET(req: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "ALL";

    const whereStatus =
      status === "PENDING"
        ? { doctorApprovalStatus: "PENDING" }
        : status === "APPROVED"
          ? { doctorApprovalStatus: "APPROVED" }
          : status === "REJECTED"
            ? { doctorApprovalStatus: "REJECTED" }
            : {};

    const doctors = await prisma.user.findMany({
      where: { role: "DOCTOR", ...whereStatus },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        doctorApprovalStatus: true,
        doctorProfile: {
          select: {
            id: true,
            specializations: true,
            experience: true,
            licenseNumber: true,
            isAvailable: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ doctors });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") return Response.json({ error: "Рұқсат жоқ" }, { status: 403 });
      if (error.message === "TWO_FACTOR_REQUIRED") return Response.json({ error: "2FA талап етіледі" }, { status: 403 });
    }
    return Response.json({ error: "Ішкі сервер қатесі" }, { status: 500 });
  }
}
