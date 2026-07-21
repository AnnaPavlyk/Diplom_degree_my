import Dashboard from "./Dashboard";
import "../styles/RoleDashboard.css";

export default function RoleDashboard() {
  const role = (localStorage.getItem("userRole") ?? "Лаборант").toLocaleLowerCase("uk-UA");
  const canSeeAnalytics = role.includes("завідувач");
  return <div className={canSeeAnalytics ? "dashboard-role-head" : "dashboard-role-limited"}><Dashboard /></div>;
}
