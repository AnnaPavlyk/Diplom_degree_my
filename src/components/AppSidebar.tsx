import { FiBookOpen, FiHome, FiHelpCircle, FiLogOut, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import logo from "../assets/images/logo.png";
import "../styles/AppSidebar.css";
import "../styles/UnifiedSidebar.css";
import { clearCurrentUser, currentUserName } from "../utils/currentUser";
import { supabase } from "../utils/supabaseClient";

type Section = "dashboard" | "workload" | "teachers" | "help" | "disciplines" | "department";

export default function AppSidebar({ active }: { active: Section }) {
  const navigate = useNavigate();
  const role = localStorage.getItem("userRole") ?? "Лаборант";
  const name = currentUserName();
  const go = (path: string) => navigate(path);
  return <aside className="app-sidebar">
    <div className="app-sidebar-brand"><img src={logo} alt="НУБіП" /><div><b>НУБіП</b><small>Система управління</small></div></div>
    <nav className="app-sidebar-nav">
      <button className={active === "dashboard" ? "active" : ""} onClick={() => go("/dashboard")}><FiHome /> Головна</button>
      <span>УПРАВЛІННЯ</span>
      <button className={active === "workload" || active === "disciplines" ? "active" : ""} onClick={() => go("/workload")}><FiBookOpen /> Навантаження</button>
      <button className={active === "teachers" ? "active" : ""} onClick={() => go("/teachers")}><FiUsers /> Викладачі</button>
      <button className={active === "department" ? "active" : ""} onClick={() => go("/department")}><FiHome /> Кафедра</button>
      <span>ДОДАТКОВО</span>
      <button className={active === "help" ? "active" : ""} onClick={() => go("/help")}><FiHelpCircle /> Довідка</button>
    </nav>
    <div className="app-sidebar-user"><FiUsers /><div><b>{name}</b><small>{role}</small></div></div>
    <button className="app-sidebar-logout" onClick={() => { clearCurrentUser(); void supabase.auth.signOut(); go("/"); }}><FiLogOut /> Вийти</button>
  </aside>;
}
