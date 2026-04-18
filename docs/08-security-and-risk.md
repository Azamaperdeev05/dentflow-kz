# 08. Қауіпсіздік және тәуекелдерді басқару

## 1. Қауіпсіздік қағидалары

- Least Privilege: әр рөл тек өзіне қажетті әрекеттерді орындайды.
- Defense in Depth: middleware, session guard, RBAC, validation, audit бірігіп жұмыс істейді.
- Fail-safe defaults: рұқсат болмаған жағдайда операция тоқтайды.

## 2. Іске асқан механизмдер

1. Аутентификация: NextAuth Credentials.
2. Құпиясөзді hash: bcryptjs.
3. 2FA: TOTP (`otplib`, QR setup).
4. RBAC: `requirePatient`, `requireDoctor`, `requireAdmin`, `canUsersChat`, `canDoctorAccessPatient`.
5. CSRF/Mutation guard: маңызды POST/PATCH route-тарда.
6. Rate limit: auth және sensitive endpoint-терде.
7. Audit log: `SecurityAuditLog`.
8. Risk scoring: `LoginRiskSignal`.

## 3. Аудит лог моделі

Жазылатын атрибуттар:

- userId, userRole
- eventType, action, resource
- status (SUCCESS/FAILED/DENIED)
- riskScore, isSuspicious
- ipAddress, userAgent, deviceFingerprint
- metadata

## 4. Тәуекел сигналдары

`security-risk.ts` ішіндегі логика:

- failedAttempts өсімі
- жаңа құрылғы факторын ескеру
- түнгі уақыттағы белсенділік
- success/fail нәтижесіне қарай score жаңарту

## 5. Қауіптер және қарсы шаралар

- Brute-force: rate limit және failed attempt tracking.
- Unauthorized access: role guard + RBAC deny.
- Data tampering: strict validation.
- Credential leakage: password hash және 2FA.
- Insider misuse: audit trail.

## 6. Жақсарту ұсыныстары

1. Production-та SQLite орнына PostgreSQL.
2. Secrets management (Vault/KMS).
3. SIEM интеграциясы.
4. Pen-test және OWASP Top 10 чек-лист.
5. Audit log retention саясатын енгізу.
