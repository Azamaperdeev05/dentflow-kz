
# CLAUDE.md

After schema changes:
→ ALWAYS run:

```
npm run db:generate
npm run db:migrate
```

---

# 🧱 TECH STACK

* Next.js 14 (App Router)
* TypeScript (STRICT)
* Prisma + SQLite
* NextAuth v5 (Credentials + 2FA)
* Tailwind CSS
* Zod (validation)
* React Hook Form
* Vitest

---

# 🏗 ARCHITECTURE

## ROLE SYSTEM

* (auth) → public
* (patient) → patient dashboard
* (doctor) → doctor dashboard
* (admin) → admin panel

Middleware enforces access control.

---

# 🔐 SECURITY RULES (STRICT)

## AUTHORIZATION

* Always use:
  * requirePatient()
  * requireDoctor()
  * requireAdmin()

## MUTATIONS

* Every mutation MUST call:

```
enforceMutationGuard()
```

## AUDIT

* Log all sensitive actions:

```
logSecurityEvent()
```

---

# 📡 API RULES

* Use session guards
* Use mutation guard
* Always validate input with Zod
* Return ONLY Kazakh error messages

Example error mapping:

* RATE_LIMIT_EXCEEDED → "Сұраныс лимиті асты"
* CSRF_INVALID → "Қауіпсіздік қатесі"
* TWO_FACTOR_INVALID → "Қате код"

---

# 🧠 CODE QUALITY RULES

## TYPESCRIPT

* Strict mode ONLY
* No `any`
* Clear naming (no abbreviations)

## VALIDATION

* All inputs must use Zod schemas
* Never trust client input

## DATABASE

* Use Prisma safely
* No raw queries unless necessary

---

# 🧩 PROJECT MODULE RULES

## src/lib/

* auth.ts → authentication logic
* session.ts → role validation (CRITICAL)
* db.ts → Prisma singleton
* rbac.ts → access control rules
* mutation-guard.ts → CSRF + rate limit
* validations.ts → Zod schemas (MANDATORY)
* kz-labels.ts → Kazakh labels
* scheduling.ts → appointment logic
* treatment-plan.ts → business logic
* two-factor.ts → 2FA
* audit-log.ts → security logging

---

# 🧱 COMPONENT RULES

* admin/ → admin UI
* doctor/ → doctor UI
* patient/ → patient UI
* shared/ → reusable components

---

# 🗄 DATABASE RULES

* Always check Prisma schema before coding
* JSON fields must be parsed properly
* Patient ↔ Doctor linked via profile IDs (NOT user IDs)

---

# 🌍 LANGUAGE RULE (CRITICAL)

ALL user-facing text MUST be Kazakh.

❌ WRONG:
"Invalid input"

✅ CORRECT:
"Қате енгізу"

---

# 🧪 TESTING RULES (TDD — SUPERPOWERS)

## RED → GREEN → REFACTOR

1. **RED** — Тест жаз. Ол FAIL болуы КЕРЕК.
2. **GREEN** — Минималды код жаз. Тек тест өтетіндей.
3. **REFACTOR** — Код тазала. Тесттер өтіп тұрғанша.

* Тестсіз код жазба. Алдымен тест.
* Тест өтпесе — commit жасама.
* YAGNI: қажет емес нәрсе жазба. Қазір керек нәрсені ғана жаз.

## Tools

* Use Vitest
* Write tests for:
  * auth logic
  * validation
  * API routes

---

# 🔍 DEBUGGING (SUPERPOWERS — SYSTEMATIC)

Қате тапқанда — жүйелі жұмыс істе, болжама жасама:

1. **Байқа** — Қате нақты не? Қай жерде? Қашан?
2. **Гипотеза** — Себебі не болуы мүмкін? (1-2 нұсқа)
3. **Тексер** — Гипотезаны дәлелде (лог, тест, breakpoint)
4. **Түзет** — Тек дәлелденген себепті түзет
5. **Верификация** — Түзетуден кейін тест өткізіп, жұмыс істейтінін дәлелде

❌ WRONG: "бірдеңе өзгертіп көрейін, мүмкін жұмыс істер"
✅ CORRECT: "қате мұнда → себебі мынау → дәлелім мынау → түзетемін"

---

# ✅ VERIFICATION (SUPERPOWERS)

"Дайын" деп айтпас бұрын:

* Тесттер өтіп тұр ма? (`npm run test`)
* Build сәтті ме? (`npm run build`)
* Lint қателер жоқ па? (`npm run lint`)
* Өз өзгертуіңді тексердің бе?

Дәлелсіз "дайын" деме. Evidence over claims.

---

# 🚀 HOW TO WORK WITH THIS PROJECT

## Step 1: Analyze

Understand existing implementation

## Step 2: Ask

Clarify if anything unclear

## Step 3: Plan

Break work into small tasks. Write plan before code.

## Step 4: Test First (TDD)

Write failing test → minimal code → refactor

## Step 5: Verify

Run tests + build + lint. Prove it works.

---

# 🔥 EXAMPLES OF GOOD TASKS

GOOD:
"Analyze login system and propose minimal fix"

BAD:
"Rewrite auth system"

---

# ⚠️ FINAL RULE

👉 This is NOT a playground

* No random refactoring
* No guessing
* No unnecessary complexity

👉 Act like a senior engineer.

---

# 🦴 CAVEMAN MODE (BONUS — TOKEN SAVER)

Respond terse. No filler. Fragments OK. Technical substance exact.

Rules:
* Drop articles (a, an, the), filler ("just", "basically", "really")
* Pattern: `[thing] [action] [reason]. [next step].`
* Short synonyms preferred
* Code, commits, PRs — normal conventions (unchanged)
* All technical accuracy preserved — only fluff removed

Example:

❌ VERBOSE:
"I'll now go ahead and update the authentication middleware to properly handle the two-factor verification flow."

✅ CAVEMAN:
"Update auth middleware. Add 2FA check."

Deactivate: say "stop caveman" or "normal mode"
