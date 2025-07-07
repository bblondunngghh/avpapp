// Import the full desktop admin panel to ensure identical interface
import AdminPanel from "./admin-panel";

// Mobile admin panel that shows exactly the same interface as desktop
export default function MobileAdminPanel() {
  return <AdminPanel />;
}