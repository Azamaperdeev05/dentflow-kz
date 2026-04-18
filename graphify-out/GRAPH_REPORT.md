# Graph Report - C:\Users\Acer\Desktop\Dent\dentflow-kz  (2026-04-18)

## Corpus Check
- 84 files · ~36,560 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 229 nodes · 220 edges · 64 communities detected
- Extraction: 74% EXTRACTED · 25% INFERRED · 1% AMBIGUOUS · INFERRED: 56 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]

## God Nodes (most connected - your core abstractions)
1. `POST()` - 30 edges
2. `GET()` - 16 edges
3. `getClientIp()` - 6 edges
4. `requireSessionUser()` - 6 edges
5. `Comprehensive Testing Guide` - 6 edges
6. `Authentication Flow Coverage` - 6 edges
7. `ErrorBoundary` - 5 edges
8. `requireSessionUserPage()` - 5 edges
9. `requireDoctorPage()` - 5 edges
10. `Treatment Flow Coverage` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Vercel Production Deployment` --conceptually_related_to--> `Globe Icon`  [AMBIGUOUS]
  DEPLOYMENT.md → public/globe.svg
- `Authentication Flow Coverage` --conceptually_related_to--> `Doctor/Stethoscope Icon (Base Set)`  [INFERRED]
  TEST_SPECIFICATIONS.md → public/icons/doctor.png
- `Authentication Flow Coverage` --conceptually_related_to--> `Patients Icon (Base Set)`  [INFERRED]
  TEST_SPECIFICATIONS.md → public/icons/patients.png
- `Authentication Flow Coverage` --conceptually_related_to--> `Profile Icon (Base Set)`  [INFERRED]
  TEST_SPECIFICATIONS.md → public/icons/profile.png
- `Authentication Flow Coverage` --conceptually_related_to--> `Logout Icon (Base Set)`  [INFERRED]
  TEST_SPECIFICATIONS.md → public/icons/logout.png

## Hyperedges (group relationships)
- **Deployment Pathways** — deployment_vercel_production_deploy, deployment_self_hosted_pm2_nginx, deployment_docker_runtime_option [EXTRACTED 0.99]
- **Clinical Workflow Icon Cluster** — calendar_calendar_icon_base, schedule_schedule_icon_base, doctor_doctor_icon_base, patients_patients_icon_base, tooth_tooth_icon_base, treatment_treatment_icon_base [INFERRED 0.83]
- **Windows 11 Icon Style Variants** — windows11_filled_icon_set, windows11_outline_icon_set, windows11_outline_settings_icon [EXTRACTED 0.97]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.1
Nodes (20): Calendar Icon (Base Set), Doctor/Stethoscope Icon (Base Set), Document File Icon, Finance/Money Icon (Base Set), Logout Icon (Base Set), Medical History Icon (Base Set), Messages Icon (Base Set), Patients Icon (Base Set) (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (9): getTransporter(), sendEmail(), cleanupExpiredPendingRegistrations(), clearPendingRegistration(), getPendingRegistration(), upsertPendingRegistration(), getClientIp(), isMedicalFileType() (+1 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (8): assertSameOrigin(), isSafeMethod(), verifyCSRFToken(), verifySameOrigin(), RegisterVerifyContent(), getRemainingAttempts(), rateLimit(), GET()

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (12): AppointmentDayPage(), formatSelectedDateLabel(), buildTimeSlots(), combineDateAndTime(), getDayKey(), getWeekdayCode(), isTimeWithinWorkingHours(), isWorkingDay() (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (11): DoctorChatPage(), DoctorDashboardPage(), PatientChatPage(), TreatmentPlanPage(), PATCH(), requireDoctor(), requireDoctorPage(), requirePatient() (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.2
Nodes (11): DentFlow KZ Deployment Guide, Docker Deployment Option, Production Security Checklist, Self-Hosted Deployment with PM2 and Nginx, Vercel Production Deployment, Globe Icon, Next.js Wordmark Logo, Next.js Bootstrap README (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (1): ErrorBoundary

### Community 7 - "Community 7"
Cohesion: 0.4
Nodes (2): uploadFileToStorage(), validateFile()

### Community 8 - "Community 8"
Cohesion: 0.33
Nodes (1): getFromCache()

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (1): sanitizeEmail()

### Community 10 - "Community 10"
Cohesion: 0.4
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 0.5
Nodes (5): Dashboard Icon (Base Set), Browser Window Icon, Windows 11 Filled Icon Set, Windows 11 Outline Icon Set, Settings Icon (Windows 11 Outline Set)

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (1): AppError

### Community 13 - "Community 13"
Cohesion: 0.67
Nodes (1): parseMonthParam()

### Community 14 - "Community 14"
Cohesion: 0.67
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 0.67
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 0.67
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 0.67
Nodes (1): send()

### Community 18 - "Community 18"
Cohesion: 0.67
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 0.67
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 0.67
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 0.67
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (2): Web App Launcher Icon, DentFlow Brand Logo

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (0): 

## Ambiguous Edges - Review These
- `Vercel Production Deployment` → `Globe Icon`  [AMBIGUOUS]
  public/globe.svg · relation: conceptually_related_to
- `Browser Window Icon` → `Dashboard Icon (Base Set)`  [AMBIGUOUS]
  public/window.svg · relation: conceptually_related_to

## Knowledge Gaps
- **20 isolated node(s):** `Self-Hosted Deployment with PM2 and Nginx`, `Docker Deployment Option`, `Notifications Coverage`, `Document File Icon`, `Globe Icon` (+15 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 23`** (2 nodes): `RootLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `page.tsx`, `requestOtp()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `togglePasswordVisibility()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `DoctorLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `formatDateLabel()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (2 nodes): `PatientLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `AuthRedirectPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `CreatePaymentForm()`, `create-payment-form.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `submit()`, `create-treatment-form.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `handleSubmit()`, `day-appointment-form.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `renderLinks()`, `doctor-nav.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `DoctorScheduleCalendar()`, `schedule-calendar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `updateStatus()`, `schedule-status-actions.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `AppointmentCalendar()`, `appointment-calendar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `DailyAppointmentForm()`, `daily-appointment-form.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `renderLinks()`, `patient-nav.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `AppSessionProvider()`, `session-provider.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `formatDateKey()`, `month-calendar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `Web App Launcher Icon`, `DentFlow Brand Logo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `middleware.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `next.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `postcss.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `vitest.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `auth.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `db.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `validations.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `next-auth.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `auth.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `test-env.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Vercel Production Deployment` and `Globe Icon`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Browser Window Icon` and `Dashboard Icon (Base Set)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `POST()` connect `Community 1` to `Community 2`, `Community 3`, `Community 4`, `Community 7`, `Community 9`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `GET()` connect `Community 2` to `Community 8`, `Community 1`, `Community 4`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `requireSessionUser()` connect `Community 4` to `Community 1`, `Community 2`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `POST()` (e.g. with `assertSameOrigin()` and `requirePatient()`) actually correct?**
  _`POST()` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `GET()` (e.g. with `RegisterVerifyContent()` and `requirePatient()`) actually correct?**
  _`GET()` has 11 INFERRED edges - model-reasoned connections that need verification._