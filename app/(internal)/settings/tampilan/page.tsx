import { SettingsSection } from "../settings-section";
import { CashierDisplaySettings } from "../cashier-display-settings";
import { DashboardSettings } from "../../dashboard/dashboard-settings";

export default function TampilanPage() {
  return (
    <SettingsSection title="Tampilan">
      <div className="space-y-6">
        <CashierDisplaySettings />
        <DashboardSettings />
      </div>
    </SettingsSection>
  );
}
