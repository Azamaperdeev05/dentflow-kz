import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_28%),linear-gradient(180deg,_#f8fcff_0%,_#eef6fb_100%)]">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl" />

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <Image src="/logo.png" alt="DentFlow KZ" width={40} height={40} className="object-contain" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">DentFlow KZ</p>
              <p className="text-sm text-slate-600">Клиникаға арналған басқару жүйесі</p>
            </div>
          </Link>

          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
              Кіру
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Тіркелу
            </Link>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-700 via-cyan-600 to-teal-500 p-6 text-white shadow-[0_20px_60px_rgba(8,145,178,0.28)] sm:p-8 lg:p-10">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_40%)]" />
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/15 ring-1 ring-white/20">
                <Image src="/logo.png" alt="DentFlow KZ" width={54} height={54} className="object-contain" />
              </div>

              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-50/90">Стоматологияға арналған цифрлық орта</p>
                <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                  Кіру, жазылу, емдеу және бақылау - бәрі бір жерде.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-cyan-50 sm:text-lg">
                  DentFlow KZ пациентке де, дәрігерге де бірдей ыңғайлы: жазылу, күнтізбе, емдеу тарихы, хабарламалар және төлемдер бір интерфейсте жинақталған. 
                  Артық қадам аз, жылдамдық көп, түсініктілік жоғары.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-cyan-800 transition hover:translate-y-[-1px] hover:bg-cyan-50"
                >
                  Бастау үшін тіркелу
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Жүйеге кіру
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { value: "1 жүйе", label: "пациент пен дәрігер үшін" },
                  { value: "3 роль", label: "пациент, дәрігер, әкімші" },
                  { value: "0 шатасу", label: "бәрі бір логикамен" },
                ].map((item) => (
                  <div key={item.value} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
                    <p className="text-xl font-black">{item.value}</p>
                    <p className="mt-1 text-sm text-cyan-50/90">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Неге ыңғайлы</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">Күнделікті жұмысты жеңілдетеді</h2>
              <div className="mt-5 space-y-4">
                {[
                  {
                    title: "Жылдам кіру және тіркелу",
                    text: "Аз қадам, таза форма, телефоннан да, компьютерден де бірдей түсінікті.",
                  },
                  {
                    title: "Пациент пен дәрігер логикасы бөлек",
                    text: "Әр рөлге тек керек панель көрсетіледі, артық мәзір мен бөгде ақпарат жоқ.",
                  },
                  {
                    title: "Кодпен растау және қауіпсіздік",
                    text: "Email растау, пароль талаптары және хэштелген сақтау қауіпсіздікті күшейтеді.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Таза интерфейс",
                  text: "Ақ кеңістік, анық контраст, көзді ауыртпайтын визуал.",
                },
                {
                  title: "Біркелкі навигация",
                  text: "Кіріп, тіркеліп, қалпына келтіру беттері бір стильде.",
                },
              ].map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Кіру",
              text: "Жүйеге пациент немесе дәрігер ретінде кіру.",
              href: "/login",
              accent: "from-cyan-50 to-white",
            },
            {
              title: "Тіркелу",
              text: "Жаңа аккаунт ашу, OTP арқылы email растау және рөл таңдау.",
              href: "/register",
              accent: "from-teal-50 to-white",
            },
            {
              title: "Құпия сөзді қалпына келтіру",
              text: "Email арқылы код алып, парольді қауіпсіз ауыстыру.",
              href: "/forgot-password",
              accent: "from-slate-50 to-white",
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`group rounded-[1.5rem] border border-slate-200 bg-gradient-to-br ${item.accent} p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl`}
            >
              <p className="text-lg font-bold text-slate-900">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700">
                Ашу
                <span className="transition group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Қалай жұмыс істейді</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">3 қадамда бастауға болады</h2>
            <div className="mt-5 space-y-4">
              {[
                "Тіркелу кезінде email расталады",
                "Пациент болсаңыз - жазыласыз, дәрігер болсаңыз - кестені басқарасыз",
                "Барлық ақпарат бір панельде, мобильде де, десктопта да ыңғайлы",
              ].map((step, index) => (
                <div key={step} className="flex gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[1.75rem] bg-slate-900 p-6 text-white shadow-lg sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Артықшылықтары</p>
            <h2 className="mt-3 text-2xl font-bold">Сізге не береді?</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                "Жазылу мен емдеу тарихын бірден бақылау",
                "Дәрігер мен пациентті шатастырмайтын рөлдік логика",
                "Күнтізбе және хабарлама арқылы нақты жоспар",
                "Жеңіл, түсінікті және әдемі интерфейс",
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10 backdrop-blur-sm">
                  <p className="text-sm leading-6 text-slate-100">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
