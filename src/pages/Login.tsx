import "../styles/Login.css";
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaChalkboardTeacher, FaFlask, FaUserTie, FaSignInAlt, FaUndo, FaCheckCircle } from "react-icons/fa";
import logo from "../assets/images/logo.png";
import laptop from "../assets/images/laptop.png";
import books from "../assets/images/books.png";
import microscope from "../assets/images/microscope.png";
import plant from "../assets/images/vazon.png";
import background from "../assets/images/background.svg";
import { supabase } from "../utils/supabaseClient";

type RoleKey = "teacher" | "lab" | "head";
const roleLabels: Record<RoleKey, string> = { teacher: "Викладач", lab: "Лаборант", head: "Завідувач кафедри" };
const serverRoles: Record<string, string> = { teacher: "Викладач", lab: "Лаборант", laborant: "Лаборант", head: "Завідувач кафедри", "Викладач": "Викладач", "Лаборант": "Лаборант", "Завідувач кафедри": "Завідувач кафедри" };

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleKey>("teacher");
  const [email, setEmail] = useState(() => localStorage.getItem("rememberedLoginEmail") ?? "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => Boolean(localStorage.getItem("rememberedLoginEmail")));
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("rememberedLoginEmail")) return;
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) return;
      const role = serverRoles[String(data.session.user.app_metadata.role ?? data.session.user.user_metadata.role ?? "")];
      if (role) { localStorage.setItem("userRole", role); navigate("/dashboard"); }
    });
  }, [navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setAuthError(""); setSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (error || !data.user) { setAuthError(error?.message ?? "Не вдалося виконати вхід. Перевірте email і пароль."); return; }
    const assignedRole = serverRoles[String(data.user.app_metadata.role ?? data.user.user_metadata.role ?? "")];
    if (!assignedRole) { await supabase.auth.signOut(); setAuthError("Для цього облікового запису не задано роль у Supabase."); return; }
    if (assignedRole !== roleLabels[selectedRole]) { await supabase.auth.signOut(); setAuthError(`Для цього облікового запису встановлено роль «${assignedRole}». Оберіть її перед входом.`); return; }
    const { data: teacherProfile } = await supabase.from("Викладач").select("ПІБ").eq("Email_викладача", data.user.email ?? "").maybeSingle();
    const profileName = String((teacherProfile as Record<string, unknown> | null)?.["ПІБ"] ?? data.user.user_metadata.full_name ?? data.user.user_metadata.name ?? data.user.email ?? "Користувач");
    if (remember) localStorage.setItem("rememberedLoginEmail", data.user.email ?? email.trim());
    else localStorage.removeItem("rememberedLoginEmail");
    localStorage.setItem("userRole", assignedRole);
    localStorage.setItem("userDisplayName", profileName);
    localStorage.setItem("userEmail", data.user.email ?? "");
    navigate("/dashboard");
  };

  const resetForm = () => { setEmail(""); setPassword(""); setAuthError(""); setRemember(false); setSelectedRole("teacher"); };

  return <div className="login-page">
    <section className="left-panel">
      <div className="university"><img src={logo} alt="НУБіП" className="logo" /><div><h1>НУБіП України</h1><p>Національний університет біоресурсів<br />і природокористування України</p></div></div>
      <div className="hero"><h2>Сучасне управління та<br />ефективна освіта</h2><div className="line" /><p>Єдина цифрова платформа для автоматизації<br />роботи кафедри та підтримки навчального процесу.</p></div>
      <div className="illustration"><img src={background} className="background-lines" alt="" /><img src={books} className="books-img" alt="Книги" /><img src={plant} className="plant-img" alt="Вазон" /><img src={laptop} className="laptop-img" alt="Ноутбук" /><img src={microscope} className="microscope-img" alt="Мікроскоп" /></div>
    </section>
    <section className="right-panel"><div className="form-wrapper"><h1>Вхід до системи</h1><p className="subtitle">Увійдіть для доступу до функцій системи</p>{authError && <div className="login-auth-error">{authError}</div>}
      <form onSubmit={handleSubmit}>
        <label>Email / Логін</label><div className="input-field"><FaEnvelope className="field-icon" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Введіть email або логін" required /></div>
        <label>Пароль</label><div className="input-field"><FaLock className="field-icon" /><input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Введіть пароль" required /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button></div>
        <div className="form-options"><label className="remember-me"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /><span>Запам&apos;ятати мене</span></label><a href="/" className="forgot-link">Забули пароль?</a></div>
        <div className="form-actions"><button type="button" className="btn-clear" onClick={resetForm}><FaUndo />Очистити форму</button><button type="submit" className="btn-login" disabled={submitting}><FaSignInAlt />{submitting ? "Вхід…" : "Увійти"}</button></div>
      </form>
      <div className="roles-section"><h3>Оберіть вашу роль у системі</h3><div className="role-grid-layout"><Role role="teacher" selected={selectedRole} onSelect={setSelectedRole} icon={<FaChalkboardTeacher />} description="Доступ до навчальних матеріалів, груп та розкладу" /><Role role="lab" selected={selectedRole} onSelect={setSelectedRole} icon={<FaFlask />} description="Управління даними кафедри та імпорт навантаження" /><Role role="head" selected={selectedRole} onSelect={setSelectedRole} icon={<FaUserTie />} description="Перегляд аналітики, навантаження та звітності" /></div></div>
    </div><footer><div className="footer-links-row"><span>© 2026 НУБіП України. Усі права захищені.</span><div className="footer-nav"><a href="/">Підтримка</a><span className="separator">•</span><a href="/">Умови використання</a><span className="separator">•</span><a href="/">Політика конфіденційності</a></div></div></footer></section>
  </div>;
}

function Role({ role, selected, onSelect, icon, description }: { role: RoleKey; selected: RoleKey; onSelect: (role: RoleKey) => void; icon: ReactNode; description: string }) {
  return <div className={`role-item ${selected === role ? "selected" : ""}`} onClick={() => onSelect(role)}>{selected === role && <FaCheckCircle className="check-mark" />}<div className={`icon-wrapper ${role === "teacher" ? "teacher" : role === "lab" ? "lab" : "head"}`}>{icon}</div><h4>{roleLabels[role]}</h4><p>{description}</p></div>;
}
