import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiBookOpen, FiEdit2, FiPlus, FiRefreshCw } from "react-icons/fi";
import { supabase } from "../utils/supabaseClient";
import AppSidebar from "../components/AppSidebar";
import "../styles/DisciplinesManager.css";

type Discipline = { code: string; name: string; departmentCode: string };
type FormState = { code: string; name: string; departmentCode: string };
const emptyForm: FormState = { code: "", name: "", departmentCode: "15.03" };

function mapDiscipline(row: Record<string, unknown>): Discipline {
  return {
    code: String(row["Код_дисципліни"] ?? ""),
    name: String(row["Назва_дисципліни"] ?? ""),
    departmentCode: String(row["Код_кафедри"] ?? ""),
  };
}

export default function Disciplines() {
  const navigate = useNavigate();
  const [role] = useState(() => localStorage.getItem("userRole") ?? "Лаборант");
  const canManage = role.toLocaleLowerCase("uk-UA").includes("лаборант");
  const [items, setItems] = useState<Discipline[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("Дисципліни").select("*").order("Назва_дисципліни");
    if (error) setNotice(`Не вдалося завантажити дисципліни: ${error.message}`);
    else setItems((data ?? []).map((row) => mapDiscipline(row as Record<string, unknown>)));
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const visibleItems = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("uk-UA");
    return term ? items.filter((item) => `${item.code} ${item.name} ${item.departmentCode}`.toLocaleLowerCase("uk-UA").includes(term)) : items;
  }, [items, query]);

  const beginEdit = (item: Discipline) => {
    if (!canManage) return;
    setEditingCode(item.code);
    setForm({ code: item.code, name: item.name, departmentCode: item.departmentCode });
    setNotice("");
  };

  const resetForm = () => { setEditingCode(null); setForm(emptyForm); };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManage) { setNotice("Редагування доступне лише для ролі «Лаборант»."); return; }
    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();
    if (!code || !name) { setNotice("Заповніть код і назву дисципліни."); return; }
    if (code.length > 3) { setNotice("Код дисципліни у вашій БД має містити не більше 3 символів."); return; }
    setSaving(true); setNotice("");
    const payload = { "Код_дисципліни": code, "Назва_дисципліни": name, "Код_кафедри": form.departmentCode.trim() || null };
    const { error } = await supabase.from("Дисципліни").upsert(payload, { onConflict: "Код_дисципліни" });
    setSaving(false);
    if (error) {
      setNotice(error.code === "42501" ? "Supabase не дозволив зберегти дані: для цієї ролі в базі немає права редагувати дисципліни." : `Не вдалося зберегти: ${error.message}`);
      return;
    }
    setNotice(editingCode ? "Зміни до дисципліни збережено." : "Дисципліну додано.");
    resetForm();
    await load();
  };

  return <div className="app-shell"><AppSidebar active="disciplines" /><main className="disciplines-manager app-shell-main">
    <header className="discipline-header">
      <div><p>Довідник кафедри</p><h1>Дисципліни</h1><span>Роль: {role}</span></div>
      <button className="dm-secondary" onClick={() => navigate("/workload")}><FiArrowLeft /> До навантаження</button>
    </header>
    {notice && <div className="dm-notice">{notice}</div>}
    <section className="dm-toolbar">
      <label>Пошук<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Код або назва дисципліни" /></label>
      <button className="dm-secondary" onClick={() => void load()} disabled={loading}><FiRefreshCw /> Оновити</button>
      {canManage && <button className="dm-primary" onClick={() => { resetForm(); document.getElementById("discipline-form")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}><FiPlus /> Додати дисципліну</button>}
    </section>
    <section className="dm-grid">
      <article className="dm-card dm-list"><div className="dm-card-title"><FiBookOpen /><h2>Усі дисципліни</h2><span>{items.length}</span></div>
        {loading ? <p className="dm-empty">Завантаження…</p> : visibleItems.length === 0 ? <p className="dm-empty">Дисциплін поки немає.</p> : <div className="dm-table-wrap"><table><thead><tr><th>Код</th><th>Назва дисципліни</th><th>Код кафедри</th>{canManage && <th>Дія</th>}</tr></thead><tbody>{visibleItems.map((item) => <tr key={item.code}><td><b>{item.code}</b></td><td>{item.name}</td><td>{item.departmentCode || "—"}</td>{canManage && <td><button className="dm-edit" onClick={() => beginEdit(item)} aria-label={`Редагувати ${item.name}`}><FiEdit2 /> Редагувати</button></td>}</tr>)}</tbody></table></div>}
      </article>
      <article className="dm-card dm-form-card" id="discipline-form"><h2>{editingCode ? "Редагувати дисципліну" : "Додати дисципліну"}</h2><p>{canManage ? "Дані будуть збережені у таблиці «Дисципліни»." : "Для цієї ролі доступний лише перегляд довідника."}</p>
        <form onSubmit={save}><label>Код дисципліни *<input value={form.code} maxLength={3} placeholder="P01" disabled={!canManage || saving || Boolean(editingCode)} onChange={(e) => setForm({ ...form, code: e.target.value })} /></label><label>Назва дисципліни *<input value={form.name} disabled={!canManage || saving} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Код кафедри<input value={form.departmentCode} disabled={!canManage || saving} onChange={(e) => setForm({ ...form, departmentCode: e.target.value })} /></label>{canManage && <div className="dm-actions"><button className="dm-primary" disabled={saving}>{saving ? "Збереження…" : editingCode ? "Зберегти" : "Додати"}</button><button type="button" className="dm-secondary" onClick={resetForm}>Скасувати</button></div>}</form>
      </article>
    </section>
  </main></div>;
}
