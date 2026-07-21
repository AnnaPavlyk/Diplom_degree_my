import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBookOpen, FiChevronDown, FiEdit2, FiEye, FiGrid, FiHelpCircle, FiLogOut, FiPlus, FiRefreshCw, FiUsers } from "react-icons/fi";
import logo from "../assets/images/logo.png";
import { supabase } from "../utils/supabaseClient";
import { currentUserName } from "../utils/currentUser";
import AppSidebar from "../components/AppSidebar";
import "../styles/TeacherWorkspace.css";
import "../styles/TeacherOverrides.css";
import "../styles/UnifiedSidebar.css";

type View = "all" | "main" | "parttime";
type Mode = "list" | "add" | "edit" | "restore";
type Teacher = { code: string; name: string; position: string; rate: string; workType: "Основний" | "Сумісник"; degree: string; rank: string; phone: string; email: string; birthDate: string; archived?: boolean };
const emptyTeacher: Teacher = { code: "", name: "", position: "Асистент", rate: "1", workType: "Основний", degree: "Без наук. ступеня", rank: "Без вч. звання", phone: "", email: "", birthDate: "" };

export default function Teachers() {
  const navigate = useNavigate();
  const [role] = useState(() => localStorage.getItem("userRole") ?? "Лаборант");
  const [profileName] = useState(currentUserName);
  const canManageTeachers = role.toLocaleLowerCase("uk-UA").includes("лаборант");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [archivedTeachers, setArchivedTeachers] = useState<Teacher[]>([]);
  const [mode, setMode] = useState<Mode>("list");
  const [view, setView] = useState<View>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [form, setForm] = useState<Teacher>(emptyTeacher);
  const [selectedCode, setSelectedCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const mapTeacher = (row: Record<string, unknown>): Teacher => ({ code: String(row["Код_викладача"] ?? ""), name: String(row["ПІБ"] ?? ""), position: "—", rate: "1", workType: "Основний", degree: String(row["Науковий_ступінь"] ?? "Без наук. ступеня"), rank: String(row["Вчене_звання"] ?? "Без вч. звання"), phone: String(row["Телефон_викладача"] ?? ""), email: String(row["Email_викладача"] ?? ""), birthDate: String(row["Дата_народження"] ?? "") });
  const loadTeachers = async () => {
    const [teacherResult, archiveResult] = await Promise.all([supabase.from("Викладач").select("*").order("ПІБ"), supabase.from("Архів").select("*").eq("Таблиця", "Викладач").order("Дата_архівації", { ascending: false })]);
    if (teacherResult.error) { setNotice(`Не вдалося завантажити викладачів: ${teacherResult.error.message}`); return; }
    if (archiveResult.error) { setNotice(`Не вдалося завантажити архів: ${archiveResult.error.message}`); return; }
    setTeachers((teacherResult.data ?? []).map((row) => mapTeacher(row as Record<string, unknown>)));
    setArchivedTeachers((archiveResult.data ?? []).map((row) => mapTeacher(((row as Record<string, unknown>)["Дані"] ?? {}) as Record<string, unknown>)).filter((teacher) => teacher.code));
  };
  // The request resolves asynchronously; the rule does not recognize the state update inside loadTeachers.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadTeachers(); }, []);
  const visibleTeachers = useMemo(() => teachers.filter((teacher) => !teacher.archived && (view === "all" || (view === "main" ? teacher.workType === "Основний" : teacher.workType === "Сумісник"))), [teachers, view]);
  const updateForm = (field: keyof Teacher, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const beginEdit = (teacher: Teacher) => { setSelectedCode(teacher.code); setForm(teacher); setMode("edit"); };
  const saveTeacher = async () => {
    if (!canManageTeachers) { setNotice("Лише лаборант може додавати або змінювати викладачів."); return; }
    if (!form.name.trim()) { setNotice("Заповніть ПІБ викладача."); return; }
    setSaving(true); setNotice(null);
    // `Код_викладача` is character(10) in the supplied database.
    const code = form.code || `V${Date.now().toString(36).toUpperCase()}`.slice(0, 10);
    const payload = { "Код_викладача": code, "ПІБ": form.name.trim(), "Вчене_звання": form.rank, "Науковий_ступінь": form.degree, "Телефон_викладача": form.phone, "Email_викладача": form.email, "Дата_народження": form.birthDate || null };
    const { error } = await supabase.from("Викладач").upsert(payload, { onConflict: "Код_викладача" });
    setSaving(false);
    if (error) { setNotice(error.code === "42501" ? "Ваша роль «Лаборант» обрана правильно, але Supabase ще не отримав її через авторизацію. У базі увімкнена політика RLS, яка блокує запис для поточної сесії. Потрібно підключити вхід Supabase Auth і надати лаборанту право INSERT/UPDATE." : `Не вдалося зберегти: ${error.message}`); return; }
    setNotice("Дані викладача збережено."); setMode("list"); setForm(emptyTeacher); await loadTeachers();
  };
  const archiveTeacher = async () => {
    if (!canManageTeachers) { setNotice("Лише лаборант може переміщувати викладачів до архіву."); return; }
    if (!form.code || !window.confirm(`Звільнити викладача «${form.name}» та перемістити його до архіву?`)) return;
    setSaving(true); setNotice(null);
    const payload = { "Код_викладача": form.code, "ПІБ": form.name, "Вчене_звання": form.rank, "Науковий_ступінь": form.degree, "Телефон_викладача": form.phone, "Email_викладача": form.email, "Дата_народження": form.birthDate || null };
    const { error: archiveError } = await supabase.from("Архів").insert({ "Таблиця": "Викладач", "Ключ_запису": form.code, "Дані": payload, "Назва": form.name });
    if (archiveError) { setSaving(false); setNotice(`Не вдалося перемістити до архіву: ${archiveError.message}`); return; }
    const { error: deleteError } = await supabase.from("Викладач").delete().eq("Код_викладача", form.code);
    setSaving(false);
    if (deleteError) { setNotice(`Архів створено, але не вдалося видалити активний запис: ${deleteError.message}`); return; }
    setNotice("Викладача переміщено до архіву."); setMode("list"); setForm(emptyTeacher); await loadTeachers();
  };
  const restoreTeacher = async (teacher: Teacher) => {
    setSaving(true); setNotice(null);
    const payload = { "Код_викладача": teacher.code, "ПІБ": teacher.name, "Вчене_звання": teacher.rank, "Науковий_ступінь": teacher.degree, "Телефон_викладача": teacher.phone, "Email_викладача": teacher.email, "Дата_народження": teacher.birthDate || null };
    const { error: restoreError } = await supabase.from("Викладач").upsert(payload, { onConflict: "Код_викладача" });
    if (!restoreError) await supabase.from("Архів").delete().eq("Таблиця", "Викладач").eq("Ключ_запису", teacher.code);
    setSaving(false);
    if (restoreError) { setNotice(`Не вдалося поновити: ${restoreError.message}`); return; }
    setNotice("Викладача поновлено на посаді."); setMode("list"); await loadTeachers();
  };
  const changeMode = (nextMode: Mode) => { if ((mode === "add" || mode === "edit") && form.name && !window.confirm("Ви переходите до іншого вікна. Незбережені зміни буде втрачено. Продовжити?")) return; setMode(nextMode); setForm(emptyTeacher); };

  return <div className={`teacher-workspace ${canManageTeachers ? "can-manage" : "read-only"}`}>
<AppSidebar active="teachers" />
<aside className="teacher-sidebar legacy-sidebar">
  <div className="teacher-brand">
    <img src={logo} alt="НУБіП" />
    <div>
      <b>НУБіП</b>
      <small>Система управління</small>
    </div>
  </div>
  <nav>
    <button onClick={() => navigate("/dashboard")}><FiGrid /> Головна</button>
    
    <span>УПРАВЛІННЯ</span>
    <button onClick={() => navigate("/workload")}><FiBookOpen /> Навантаження</button>
    {/* Тепер "Викладачі" йдуть перед "Кафедра" */}
    <button className="active"><FiUsers /> Викладачі</button>
    <button onClick={() => navigate("/department")}><FiGrid /> Кафедра</button>
    
    <span>ДОДАТКОВО</span>
    <button onClick={() => navigate("/help")}><FiHelpCircle /> Довідка</button>
  </nav>
  <div className="teacher-user">
    <FiUsers />
    <div>
      <b>{profileName}</b>
      <small>{role}</small>
    </div>
  </div>
  <button 
    className="teacher-logout" 
    onClick={() => { localStorage.clear(); void supabase.auth.signOut(); navigate("/"); }}
  >
    <FiLogOut /> Вийти
  </button>
</aside>
    <main className="teacher-main"><header><div><p>Управління кадровим складом</p><h1>Викладачі кафедри</h1></div><div className="teacher-menu"><button className="teacher-menu-button" onClick={() => setMenuOpen((open) => !open)}><FiUsers /> Викладач <FiChevronDown /></button>{menuOpen && <div className="teacher-dropdown"><button onClick={() => { setMenuOpen(false); changeMode("add"); }}><FiPlus /> Додати</button><button onClick={() => { setMenuOpen(false); setMode("edit"); }}><FiEdit2 /> Редагувати</button><div className="dropdown-view" style={{ position: "relative" }} onMouseEnter={() => setViewMenuOpen(true)} onMouseLeave={() => setViewMenuOpen(false)}><button className="dropdown-label" style={{ display: "flex", alignItems: "center", gap: 8 }}><FiEye /> Переглянути <span style={{ marginLeft: "auto", fontSize: 18 }}>›</span></button>{viewMenuOpen && <div className="teacher-submenu" style={{ position: "absolute", left: "calc(100% + 6px)", top: -6, width: 190, padding: 6, background: "white", border: "1px solid #dbe3ee", borderRadius: 8, boxShadow: "0 10px 22px rgba(15,23,42,.14)" }}><button onClick={() => { setView("all"); setMenuOpen(false); setMode("list"); }}>Усі співробітники</button><button onClick={() => { setView("main"); setMenuOpen(false); setMode("list"); }}>Основні</button><button onClick={() => { setView("parttime"); setMenuOpen(false); setMode("list"); }}>Сумісники</button></div>}</div><button onClick={() => { setMenuOpen(false); setMode("restore"); }}><FiRefreshCw /> Поновити</button></div>}</div></header>
      {notice && <div className="teacher-notice">{notice}</div>}
      {mode === "list" && <TeacherTable teachers={visibleTeachers} view={view} onEdit={beginEdit} />}
      {(mode === "add" || mode === "edit") && <TeacherForm mode={mode} form={form} teachers={teachers} selectedCode={selectedCode} onSelect={(code) => { const teacher = teachers.find((item) => item.code === code); if (teacher) { setSelectedCode(code); setForm(teacher); } }} onChange={updateForm} onSave={saveTeacher} onArchive={archiveTeacher} onCancel={() => changeMode("list")} saving={saving} />}
      {mode === "restore" && <RestorePanel teachers={archivedTeachers} onRestore={restoreTeacher} onBack={() => setMode("list")} saving={saving} />}
    </main>
  </div>;
}

function TeacherTable({ teachers, view, onEdit }: { teachers: Teacher[]; view: View; onEdit: (teacher: Teacher) => void }) { return <section className="teacher-card"><div className="teacher-card-title"><div><h2>Співробітники кафедри Комп&apos;ютерних наук</h2><p>{view === "all" ? "Усі співробітники" : view === "main" ? "Основні працівники" : "Сумісники"}</p></div><span>{teachers.length} осіб</span></div><div className="teacher-table-wrap"><table><thead><tr><th>№</th><th>ПІБ</th><th>Посада</th><th>Ставка</th>{view === "all" ? <><th>Науковий ступінь</th><th>Вчене звання</th><th>Дата народження</th><th>Телефон</th><th>Email</th></> : <><th>Дата прийому</th><th>Дата звільнення</th></>}<th /></tr></thead><tbody>{teachers.length ? teachers.map((teacher, index) => <tr key={teacher.code}><td>{index + 1}</td><td className="teacher-name">{teacher.name}</td><td>{teacher.position}</td><td>{teacher.rate}</td>{view === "all" ? <><td>{teacher.degree}</td><td>{teacher.rank}</td><td>{teacher.birthDate || "—"}</td><td>{teacher.phone || "—"}</td><td>{teacher.email || "—"}</td></> : <><td>—</td><td>—</td></>}<td><button className="table-edit" onClick={() => onEdit(teacher)}>Редагувати</button></td></tr>) : <tr><td colSpan={10}>Викладачів ще немає. Оберіть «Викладач → Додати».</td></tr>}</tbody></table></div></section>; }

function TeacherForm({ mode, form, teachers, selectedCode, onSelect, onChange, onSave, onCancel, onArchive, saving }: { mode: Mode; form: Teacher; teachers: Teacher[]; selectedCode: string; onSelect: (code: string) => void; onChange: (field: keyof Teacher, value: string) => void; onSave: () => void; onCancel: () => void; onArchive: () => void; saving: boolean }) { return <section className="teacher-card teacher-form"><h2>{mode === "add" ? "Додати викладача" : "Редагувати викладача"}</h2>{mode === "edit" && <label>Оберіть викладача<select value={selectedCode} onChange={(event) => onSelect(event.target.value)}><option value="">— оберіть —</option>{teachers.map((teacher) => <option key={teacher.code} value={teacher.code}>{teacher.name}</option>)}</select></label>}<div className="teacher-form-grid"><label>ПІБ *<input value={form.name} onChange={(event) => onChange("name", event.target.value)} placeholder="Прізвище Ім'я По батькові" /></label><label>Посада<select value={form.position} onChange={(event) => onChange("position", event.target.value)}>{["Асистент", "Старший викладач", "Доцент", "Професор"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Зайнятість<select value={form.rate} onChange={(event) => onChange("rate", event.target.value)}>{["0.25", "0.5", "0.75", "1", "1.25", "1.5"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Вид роботи<select value={form.workType} onChange={(event) => onChange("workType", event.target.value)}><option>Основний</option><option>Сумісник</option></select></label><label>Науковий ступінь<select value={form.degree} onChange={(event) => onChange("degree", event.target.value)}><option>Без наук. ступеня</option><option>Канд. наук</option><option>Д-р наук</option></select></label><label>Вчене звання<select value={form.rank} onChange={(event) => onChange("rank", event.target.value)}><option>Без вч. звання</option><option>Доцент</option><option>Професор</option></select></label><label>Телефон<input value={form.phone} onChange={(event) => onChange("phone", event.target.value)} /></label><label>Електронна пошта<input type="email" value={form.email} onChange={(event) => onChange("email", event.target.value)} /></label><label>Дата народження<input type="date" value={form.birthDate} onChange={(event) => onChange("birthDate", event.target.value)} /></label></div><div className="teacher-actions"><button className="primary" disabled={saving} onClick={onSave}>{saving ? "Збереження…" : mode === "add" ? "Додати" : "Зберегти"}</button>{mode === "edit" && <button className="danger" disabled={!form.code || saving} onClick={onArchive}>Звільнити</button>}<button onClick={onCancel}>Скасувати зміни</button></div></section>; }
function RestorePanel({ teachers, onRestore, onBack, saving }: { teachers: Teacher[]; onRestore: (teacher: Teacher) => void; onBack: () => void; saving: boolean }) { return <section className="teacher-card restore"><h2>Поновити викладача</h2><p>Оберіть співробітника, якого потрібно повернути на посаду.</p>{teachers.length ? <div className="teacher-actions">{teachers.map((teacher) => <button className="primary" disabled={saving} key={teacher.code} onClick={() => onRestore(teacher)}>Поновити: {teacher.name}</button>)}</div> : <p className="empty-archive">Архівних співробітників немає.</p>}<button onClick={onBack}>Повернутися</button></section>; }
