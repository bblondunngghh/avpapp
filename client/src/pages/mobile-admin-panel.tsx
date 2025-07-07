// Import the full desktop admin panel to ensure identical interface
import AdminPanel from "./admin-panel-fixed";

// Mobile admin panel that shows exactly the same interface as desktop
export default function MobileAdminPanel() {
  return <AdminPanel />;
}