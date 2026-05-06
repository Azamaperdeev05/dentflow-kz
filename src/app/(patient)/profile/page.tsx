import { requirePatientPage } from "@/lib/session";
import { PatientProfileEditor } from "@/components/patient/patient-profile-editor";
import { TwoFactorSettings } from "@/components/shared/two-factor-settings";

export const metadata = {
  title: "Профиль - DentFlow KZ",
};

export default async function PatientProfilePage() {
  const { user, patientProfile } = await requirePatientPage();

  return (
    <div className="space-y-6">
      <PatientProfileEditor
        user={{
          name: user.name,
          email: user.email,
          phone: user.phone,
        }}
        patientProfile={patientProfile}
      />

      <TwoFactorSettings initialEnabled={user.twoFactorEnabled} />
    </div>
  );
}
