# 5. Деректер базасын жобалау

## 5.1 ДББЖ таңдау

| Параметр | Мәні |
|----------|------|
| **ДББЖ** | SQLite (dev), PostgreSQL-ready (production) |
| **ORM** | Prisma 5.x |
| **Кесте саны** | 16 |
| **Байланыс** | 1:1, 1:N қатынастары |

## 5.2 ER-диаграмма (Entity Relationship)

```
┌───────────────┐     1:1     ┌──────────────────┐
│     User      │────────────▶│  PatientProfile   │
│  (id, email,  │             │  (birthDate,      │
│   password,   │             │   gender, blood,  │
│   role, 2FA)  │             │   allergies)      │
│               │     1:1     ├──────────────────┤
│               │────────────▶│  DoctorProfile    │
│               │             │  (specializations,│
│               │             │   workDays, slot)  │
└───────┬───────┘             └──────────────────┘
        │
        │ 1:N
        ├──────────────▶ Appointment (dateTime, status, complaint)
        │                    │
        │                    └───▶ AppointmentSlot
        │
        ├──────────────▶ Treatment (diagnosis, procedures, totalCost, status)
        │                    │
        │                    └───▶ Payment (amount, method, note)
        │
        ├──────────────▶ Message (content[encrypted], fileUrl, isRead)
        │
        ├──────────────▶ Notification (title, message, isRead)
        │
        ├──────────────▶ MedicalFile (fileName, fileUrl, fileType)
        │
        ├──────────────▶ SecurityAuditLog (eventType, action, resource)
        │
        ├──────────────▶ LoginRiskSignal (ipAddress, riskScore)
        │
        ├──────────────▶ LoginOtp (code, expiresAt)
        │
        ├──────────────▶ PasswordReset (token, expiresAt)
        │
        └──────────────▶ PendingRegistration (email, code)
                         RateLimitAttempt (key, identity, timestamp)
```

## 5.3 Негізгі кестелер сипаттамасы

### User (Қолданушы)
| Өріс | Тип | Сипаттамасы |
|------|-----|-------------|
| id | String (cuid) | Бірегей ID |
| email | String (unique) | Email мекенжайы |
| password | String | bcrypt хэш |
| role | Enum (PATIENT/DOCTOR/ADMIN) | Рөлі |
| name | String | Аты-жөні |
| phone | String? | Телефон |
| isVerified | Boolean | Email расталған ба |
| twoFactorEnabled | Boolean | 2FA қосылған ба |
| twoFactorSecret | String? | TOTP құпия кілт |
| doctorApprovalStatus | Enum? | Дәрігер бекіту статусы |

### PatientProfile (Пациент профилі)
| Өріс | Тип | Сипаттамасы |
|------|-----|-------------|
| id | String (cuid) | Бірегей ID |
| userId | String (unique) | User-ге сілтеме |
| birthDate | DateTime? | Туған күні |
| gender | String? | Жынысы (MALE/FEMALE) |
| region | String? | Облыс |
| address | String? | Мекенжай |
| bloodType | String? | Қан тобы |
| allergies | String? | Аллергия (JSON) |
| notes | String? | Ескертпе |

### DoctorProfile (Дәрігер профилі)
| Өріс | Тип | Сипаттамасы |
|------|-----|-------------|
| id | String (cuid) | Бірегей ID |
| userId | String (unique) | User-ге сілтеме |
| specializations | String? | Мамандықтар (JSON) |
| experience | Int? | Тәжірибе жылы |
| licenseNumber | String? | Лицензия нөмірі |
| education | String? | Білімі |
| about | String? | Өзі туралы |
| rating | Float | Рейтинг (default: 0) |
| isAvailable | Boolean | Қолжетімді ме |
| workDays | String? | Жұмыс күндері (JSON) |
| workHoursStart | String? | Бастау уақыты |
| workHoursEnd | String? | Аяқтау уақыты |
| slotDuration | Int | Слот ұзақтығы (минут) |

### Appointment (Қабылдау)
| Өріс | Тип | Сипаттамасы |
|------|-----|-------------|
| id | String (cuid) | Бірегей ID |
| patientId | String | PatientProfile.id |
| doctorId | String | DoctorProfile.id |
| dateTime | DateTime | Қабылдау уақыты |
| status | Enum | SCHEDULED/COMPLETED/CANCELLED/NO_SHOW |
| complaint | String? | Шағым |
| type | String? | Қабылдау түрі |

### Treatment (Емдеу жоспары)
| Өріс | Тип | Сипаттамасы |
|------|-----|-------------|
| id | String (cuid) | Бірегей ID |
| patientId | String | PatientProfile.id |
| doctorId | String | DoctorProfile.id |
| appointmentId | String? | Қабылдауға сілтеме |
| diagnosis | String | Диагноз |
| procedures | String | Процедуралар |
| totalCost | Float | Жалпы құн |
| status | Enum | PENDING/APPROVED/REJECTED/IN_PROGRESS/COMPLETED |

## 5.4 Индекстер

Жүйеде Prisma автоматты индекстерден басқа:
- `User.email` — unique index
- `PatientProfile.userId` — unique index
- `DoctorProfile.userId` — unique index
- `Appointment(patientId, dateTime)` — composite lookup
- `Message(senderId, receiverId)` — чат іздеу
- `SecurityAuditLog(userId, createdAt)` — аудит сұрау
