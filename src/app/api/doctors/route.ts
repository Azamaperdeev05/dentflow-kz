import { prisma } from "@/lib/db";
import { requirePatient } from "@/lib/session";

export async function GET(req: Request) {
  try {
    await requirePatient();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const specialization = searchParams.get("specialization")?.trim() ?? "";
    const availableOnly = searchParams.get("available") === "1";

    const doctors = await prisma.doctorProfile.findMany({
      where: {
        ...(specialization ? { specializations: { contains: specialization } } : {}),
        ...(availableOnly ? { isAvailable: true } : {}),
        ...(q
          ? {
              OR: [
                { specializations: { contains: q } },
                { user: { name: { contains: q } } },
              ],
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
      take: 50,
    });

    return Response.json({ doctors });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return Response.json({ error: "Рұқсат жоқ" }, { status: 403 });
    }

    return Response.json({ error: "Сервер қатесі" }, { status: 500 });
  }
}
