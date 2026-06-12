import { SettingsSection } from "../settings-section"
import { CashierDisplaySettings } from "../cashier-display-settings"

export default function TampilanPage() {
  return (
    <SettingsSection title="Tampilan Kasir">
      <CashierDisplaySettings />
    </SettingsSection>
  )
}
