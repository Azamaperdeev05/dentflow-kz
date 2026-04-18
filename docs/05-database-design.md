# 05. Деректер базасын жобалау

## 1. Қолданылған СУБД

- SQLite
- ORM: Prisma

## 2. Негізгі кестелер

### Identity және қауіпсіздік

- User
- PendingRegistration
- PasswordReset
- LoginOtp
- RateLimitAttempt
- SecurityAuditLog
- LoginRiskSignal

### Клиникалық процесс

- PatientProfile
- DoctorProfile
- Appointment
- AppointmentSlot
- Treatment
- Payment

### Коммуникация

- Message
- Notification
- MedicalFile

## 3. Маңызды өрістер

- `User.role`: PATIENT/DOCTOR/ADMIN.
- `DoctorProfile.specializations`: JSON string түрінде көптік мамандық.
- `Appointment.status`: қабылдаудың lifecycle күйі.
- `Treatment.totalCost`, `Treatment.paidAmount`: қаржылық есеп.
- `SecurityAuditLog`: әрекет, ресурс, статус, тәуекел, IP/UserAgent.
- `LoginRiskSignal`: сәтсіз әрекеттер мен risk score.

## 4. Байланыстар

- User -> PatientProfile (1:1)
- User -> DoctorProfile (1:1)
- PatientProfile -> Appointment (1:N)
- DoctorProfile -> Appointment (1:N)
- Appointment -> Treatment (1:0..1)
- Treatment -> Payment (1:N)
- User -> Message (sender/receiver қатынастары)

## 5. Индекстер және өнімділік

Schema-де жиі сұралатын өрістер үшін индекстер берілген:

- `createdAt`, `status`, `action`, `isSuspicious`, `riskScore`
- `dateTime`, `doctorId`, `patientId`
- `senderId`, `receiverId`, `isRead`

## 6. Нормализация

Жалпы модель 3NF-қа жақын жобаланған.

- Қайталанатын құрылымдар жеке кестеге шығарылған.
- Жеке кейбір икемді өрістер JSON форматта сақталады (specializations, workDays, procedures).

## 7. Миграция саясаты

- Prisma migrations арқылы версиялау.
- Schema өзгерістері migration файлдармен тіркеледі.
- Production-та backup жасап барып migration қолдану керек.

## 8. Болашақта кеңейту

- SQLite -> PostgreSQL көшу.
- Reporting үшін материалданған view/analytics schema қосу.
- Multi-clinic режиміне tenant өрістерін енгізу.
