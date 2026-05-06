import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Ескі деректерді тазалау...");

  // Барлық кестелерді тазалау (тәуелділік ретімен)
  await prisma.rateLimitAttempt.deleteMany();
  await prisma.loginOtp.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.pendingRegistration.deleteMany();
  await prisma.loginRiskSignal.deleteMany();
  await prisma.securityAuditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.medicalFile.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.appointmentSlot.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Ескі деректер тазаланды");

  // Құпиясөздерді хэштеу
  const patientPassword = await hash("Qazaq123!", 12);
  const doctorPassword = await hash("Qazaq123!", 12);
  const adminPassword = await hash("Admin123!", 14);

  // ──────────────────────────────────────
  // 1. АДМИН
  // ──────────────────────────────────────
  console.log("🔒 Админ жасалуда...");
  await prisma.user.create({
    data: {
      email: "admin@dentflow.kz",
      password: adminPassword,
      role: "ADMIN",
      name: "Security Admin",
      isVerified: true,
      twoFactorEnabled: false,
    },
  });

  // ──────────────────────────────────────
  // 2. ДӘРІГЕРЛЕР (5 адам)
  // ──────────────────────────────────────
  console.log("🩺 Дәрігерлер жасалуда...");
  const doctors = [
    {
      email: "aidos.nursultanuly@dentflow.kz",
      name: "Айдос Нұрсұлтанұлы",
      phone: "+7 701 111 2233",
      specializations: ["Терапевт", "Эндодонтист"],
      experience: 8,
      licenseNumber: "KZ-DENT-2018-0451",
      education: "ҚазҰМУ, Стоматология факультеті, 2016",
      about: "Тіс емдеу және каналдарды емдеу бойынша маман. 8 жылдық тәжірибе.",
      workDays: ["Дс", "Сс", "Ср", "Бс", "Жм"],
      workHoursStart: "09:00",
      workHoursEnd: "18:00",
      slotDuration: 30,
    },
    {
      email: "aruzhan.bekzatkyzy@dentflow.kz",
      name: "Аружан Бекзатқызы",
      phone: "+7 702 222 3344",
      specializations: ["Ортодонт"],
      experience: 6,
      licenseNumber: "KZ-DENT-2020-0782",
      education: "Астана медицина университеті, 2018",
      about: "Тіс қатарын түзету, брекеттер және элайнерлер маманы.",
      workDays: ["Дс", "Ср", "Жм"],
      workHoursStart: "10:00",
      workHoursEnd: "17:00",
      slotDuration: 45,
    },
    {
      email: "erzhan.kairatuly@dentflow.kz",
      name: "Ержан Қайратұлы",
      phone: "+7 705 333 4455",
      specializations: ["Хирург", "Имплантолог"],
      experience: 12,
      licenseNumber: "KZ-DENT-2014-0215",
      education: "С.Ж. Асфендияров атындағы ҚазҰМУ, 2012",
      about: "Тіс жұлу, имплантация және хирургиялық операциялар маманы. 12 жыл тәжірибе.",
      workDays: ["Сс", "Бс", "Сб"],
      workHoursStart: "08:00",
      workHoursEnd: "16:00",
      slotDuration: 60,
    },
    {
      email: "madina.sarsenkyzy@dentflow.kz",
      name: "Мадина Сәрсенқызы",
      phone: "+7 707 444 5566",
      specializations: ["Пародонтолог"],
      experience: 5,
      licenseNumber: "KZ-DENT-2021-1023",
      education: "Семей медицина университеті, 2019",
      about: "Қызыл ет аурулары, пародонтит емі және гигиена маманы.",
      workDays: ["Дс", "Сс", "Ср", "Бс"],
      workHoursStart: "09:00",
      workHoursEnd: "17:00",
      slotDuration: 30,
    },
    {
      email: "nurlan.adilkhanuly@dentflow.kz",
      name: "Нұрлан Әділханұлы",
      phone: "+7 708 555 6677",
      specializations: ["Имплантолог", "Ортопед"],
      experience: 10,
      licenseNumber: "KZ-DENT-2016-0388",
      education: "Алматы мемлекеттік стоматология институты, 2014",
      about: "Тіс имплантациясы және протездеу бойынша 10 жылдық тәжірибе.",
      workDays: ["Дс", "Ср", "Жм"],
      workHoursStart: "09:00",
      workHoursEnd: "18:00",
      slotDuration: 45,
    },
  ];

  for (const doc of doctors) {
    await prisma.user.create({
      data: {
        email: doc.email,
        password: doctorPassword,
        role: "DOCTOR",
        name: doc.name,
        phone: doc.phone,
        isVerified: true,
        twoFactorEnabled: false,
        doctorApprovalStatus: "APPROVED",
        doctorProfile: {
          create: {
            specializations: JSON.stringify(doc.specializations),
            experience: doc.experience,
            licenseNumber: doc.licenseNumber,
            education: doc.education,
            about: doc.about,
            isAvailable: true,
            workDays: JSON.stringify(doc.workDays),
            workHoursStart: doc.workHoursStart,
            workHoursEnd: doc.workHoursEnd,
            slotDuration: doc.slotDuration,
            rating: 0,
            reviewCount: 0,
          },
        },
      },
    });
  }

  // ──────────────────────────────────────
  // 3. ПАЦИЕНТТЕР (10 адам)
  // ──────────────────────────────────────
  console.log("👤 Пациенттер жасалуда...");
  const patients = [
    {
      email: "aysulu.tolegenkyzy@dentflow.kz",
      name: "Айсұлу Төлегенқызы",
      phone: "+7 700 100 2001",
      profile: { gender: "FEMALE", region: "Алматы қаласы", bloodType: "II+", birthDate: new Date("1995-03-15") },
    },
    {
      email: "bekzat.nurdauletuly@dentflow.kz",
      name: "Бекзат Нұрдәулетұлы",
      phone: "+7 700 200 3002",
      profile: { gender: "MALE", region: "Астана қаласы", bloodType: "I+", birthDate: new Date("1990-07-22") },
    },
    {
      email: "gulnar.kanatkyzy@dentflow.kz",
      name: "Гүлнар Қанатқызы",
      phone: "+7 700 300 4003",
      profile: { gender: "FEMALE", region: "Қарағанды облысы", birthDate: new Date("1988-11-10") },
    },
    {
      email: "daniyar.muratuly@dentflow.kz",
      name: "Данияр Мұратұлы",
      phone: "+7 700 400 5004",
      profile: { gender: "MALE", region: "Шымкент қаласы", bloodType: "III-", birthDate: new Date("1997-01-05") },
    },
    {
      email: "kamila.bolatkyzy@dentflow.kz",
      name: "Камила Болатқызы",
      phone: "+7 700 500 6005",
      profile: { gender: "FEMALE", region: "Ақтөбе облысы", birthDate: new Date("2000-06-18") },
    },
    {
      email: "moldir.asetkyzy@dentflow.kz",
      name: "Мөлдір Әсетқызы",
      phone: "+7 700 600 7006",
      profile: { gender: "FEMALE", region: "Атырау облысы", bloodType: "IV+", birthDate: new Date("1993-09-25") },
    },
    {
      email: "ruslan.serikuly@dentflow.kz",
      name: "Руслан Серікұлы",
      phone: "+7 700 700 8007",
      profile: { gender: "MALE", region: "Маңғыстау облысы", birthDate: new Date("1985-12-30") },
    },
    {
      email: "samat.erkinuly@dentflow.kz",
      name: "Самат Еркінұлы",
      phone: "+7 700 800 9008",
      profile: { gender: "MALE", region: "Павлодар облысы", bloodType: "I-", birthDate: new Date("1992-04-14") },
    },
    {
      email: "timur.rakhymuly@dentflow.kz",
      name: "Тимур Рахымұлы",
      phone: "+7 700 900 1009",
      profile: { gender: "MALE", region: "Қостанай облысы", birthDate: new Date("1998-08-08") },
    },
    {
      email: "aliya.zhanbolatkyzy@dentflow.kz",
      name: "Әлия Жанболатқызы",
      phone: "+7 701 000 2010",
      profile: { gender: "FEMALE", region: "Түркістан облысы", bloodType: "II-", birthDate: new Date("1996-02-20") },
    },
  ];

  for (const pat of patients) {
    await prisma.user.create({
      data: {
        email: pat.email,
        password: patientPassword,
        role: "PATIENT",
        name: pat.name,
        phone: pat.phone,
        isVerified: true,
        twoFactorEnabled: false,
        patientProfile: {
          create: {
            gender: pat.profile.gender ?? null,
            region: pat.profile.region ?? null,
            bloodType: pat.profile.bloodType ?? null,
            birthDate: pat.profile.birthDate ?? null,
          },
        },
      },
    });
  }

  // ──────────────────────────────────────
  // Қорытынды
  // ──────────────────────────────────────
  const userCount = await prisma.user.count();
  const doctorCount = await prisma.doctorProfile.count();
  const patientCount = await prisma.patientProfile.count();

  console.log("");
  console.log("═══════════════════════════════════════");
  console.log("  🦷 DentFlow KZ — Seed аяқталды!");
  console.log("═══════════════════════════════════════");
  console.log(`  👥 Жалпы пайдаланушылар: ${userCount}`);
  console.log(`  🩺 Дәрігерлер: ${doctorCount}`);
  console.log(`  👤 Пациенттер: ${patientCount}`);
  console.log(`  🔒 Админ: 1`);
  console.log("");
  console.log("  Кіру деректері:");
  console.log("  • Пациент/Дәрігер: Qazaq123!");
  console.log("  • Админ: Admin123!");
  console.log("═══════════════════════════════════════");
}

main()
  .catch((error) => {
    console.error("❌ Seed қатесі:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
