# 7. Қауіпсіздік моделі

## 7.1 Қауіпсіздік принциптері

| Принцип | Қолдану |
|---------|---------|
| **Least Privilege** | Әр рөл тек өзіне қажет деректерге қол жеткізеді |
| **Defense in Depth** | Бірнеше қорғаныс қабаты (session, RBAC, validation, rate limit) |
| **Fail-Safe Defaults** | Рұқсат жоқ — әдепкі мән |
| **Input Validation** | Барлық кіріс деректері Zod schema арқылы тексеріледі |
| **Audit Everything** | Маңызды әрекеттер SecurityAuditLog-қа жазылады |

## 7.2 Аутентификация

### Тіркелу ағымы
```
Email + Password → Zod валидация → bcrypt хэштеу →
PendingRegistration жасау → OTP email жіберу →
Пайдаланушы OTP енгізеді → User жасалады → Кіру
```

### Кіру ағымы
```
Email + Password → bcrypt салыстыру →
2FA қосылған ба? → Иә → TOTP код сұрау → Тексеру
                  → Жоқ → Session жасау → Redirect
```

### 2FA (Two-Factor Authentication)
- **Алгоритм:** TOTP (Time-based One-Time Password)
- **Кітапхана:** otpauth
- **QR-код:** Base32 кодталған secret
- **Қалпына келтіру:** Email OTP арқылы 2FA-ны өшіру мүмкіндігі

## 7.3 Авторизация (RBAC)

| Функция | Қорғау нысаны |
|---------|---------------|
| `requirePatient()` | Тек PATIENT рөлі, PatientProfile бар |
| `requireDoctor()` | Тек DOCTOR рөлі, APPROVED статус |
| `requireAdmin()` | Тек ADMIN рөлі |

Мысал:
```typescript
// src/lib/session.ts
export async function requirePatient() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("UNAUTHORIZED");
  if (session.user.role !== "PATIENT") throw new Error("FORBIDDEN");
  // PatientProfile жүктеу...
}
```

## 7.4 Деректер қорғау

### Құпиясөз хэштеу
- **Алгоритм:** bcryptjs
- **Salt rounds:** 12
- **Ешқашан:** plaintext сақтамайды

### Чат шифрлау
- **Алгоритм:** AES-256-CBC
- **Кілт:** ENCRYPTION_KEY (.env)
- **IV:** Әр хабарлама үшін кездейсоқ 16 байт
- **Формат:** `iv:ciphertext` (hex)

### XSS қорғанысы
- `sanitize.ts` — HTML тегтерін жою
- React DOM автоматты escaping
- Content Security Policy headers

## 7.5 Rate Limiting

### enforceMutationGuard()
```typescript
await enforceMutationGuard(req, {
  key: "patient_profile_update",
  identity: patientProfile.id,
  maxAttempts: 20,
  windowMs: 15 * 60 * 1000, // 15 минут
});
```

| Endpoint | Max сұрау | Уақыт терезесі |
|----------|-----------|----------------|
| Login | 10 | 15 мин |
| Register | 5 | 15 мин |
| Profile update | 20 | 15 мин |
| Treatment create | 20 | 15 мин |
| Password reset | 5 | 15 мин |

## 7.6 Аудит журналы (Security Audit Log)

Жүйеде барлық маңызды әрекеттер SecurityAuditLog кестесіне жазылады:

| Өріс | Сипаттамасы |
|------|-------------|
| userId | Әрекет жасаған пайдаланушы |
| userRole | Рөлі |
| eventType | AUTH / DATA_CHANGE / ADMIN_ACTION / SECURITY |
| action | LOGIN_SUCCESS / PATIENT_PROFILE_UPDATE / т.б. |
| resource | USER / APPOINTMENT / TREATMENT / т.б. |
| resourceId | Ресурс ID |
| ipAddress | IP мекенжайы |
| userAgent | Браузер ақпараты |
| metadata | Қосымша JSON деректер |

## 7.7 Тәуекел скоринг (Login Risk)

LoginRiskSignal кестесі арқылы күдікті кіру әрекеттерін анықтау:

- IP мекенжайы тексерісі
- User-Agent тексерісі
- Fingerprint салыстыру
- Тәуекел баллы (riskScore: 0–100)
- Жоғары балл кезінде қосымша верификация
