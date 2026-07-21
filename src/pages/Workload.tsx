import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import "../styles/Workload.css";
import "../styles/WorkloadRoleActions.css";
import "../styles/UnifiedSidebar.css";
import { useNavigate } from "react-router-dom";
import { FiBell, FiBookOpen, FiChevronDown, FiClipboard, FiGrid, FiHelpCircle, FiLogOut, FiPlusCircle, FiSearch, FiUsers } from "react-icons/fi";
import logo from "../assets/images/logo.png";
import { supabase } from "../utils/supabaseClient";
import { currentUserName } from "../utils/currentUser";
import AppSidebar from "../components/AppSidebar";

export interface Teacher {
  id: number;
  name: string;
  position: string;
  rate: number;
}

export interface Discipline {
  id: number;
  name: string;
  hours: number;
  semester: number;
  teacher_id?: number | null;
  group_code?: string | null;
  study_form?: StudyForm;
  academic_year?: string;
}

export interface Vacancy {
  id: number;
  discipline_name: string;
  group_code: string;
  work_type: string;
  hours: number;
  is_assigned: boolean;
  study_form?: StudyForm;
  academic_year?: string;
}

interface WorkloadRecord {
  id: number;
  teacher_id: number;
  discipline_name: string;
  groups: string;
  academic_year: string;
  study_form: StudyForm;
  semester?: number;
  lectures?: number;
  labs?: number;
  practices?: number;
  exams?: number;
  credits?: number;
  course_projects?: number;
  consultations?: number;
  seminars?: number;
  diploma_students?: number;
  practice_hours?: number;
  postgraduates?: number;
}

type StudyForm = "Денна" | "Заочна";
type Tab = "adjust" | "report" | "form56" | "vacancies" | "disciplines";
type ImportResult = { teachers: number; disciplines: number; workloads: number };

const YEARS = ["2024/2025", "2025/2026", "2026/2027"];
const inputClass = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
const primaryButton = "rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";
const TAB_ITEMS: { key: Tab; label: string; icon: React.ReactNode; subtitle: string }[] = [
  { key: "adjust", label: "Розподіл годин", icon: <FiPlusCircle />, subtitle: "Переглядайте та коригуйте навантаження конкретного викладача." },
  { key: "report", label: "Звіт викладача", icon: <FiUsers />, subtitle: "Сформуйте зрозумілий звіт з усіма видами навчальної роботи." },
  { key: "form56", label: "Зведення кафедри", icon: <FiClipboard />, subtitle: "Порівнюйте обсяг роботи всіх викладачів за обраний рік." },
  { key: "vacancies", label: "Вакантні години", icon: <FiSearch />, subtitle: "Знайдіть години, які ще потрібно розподілити." },
  { key: "disciplines", label: "Дисципліни", icon: <FiBookOpen />, subtitle: "Переглядайте дисципліни та відповідальних викладачів." },
];

const number = (value: unknown) => Number(value ?? 0);
const normalizeColumn = (value: string) => value.toLocaleLowerCase("uk-UA").replace(/[\s_\-./]/g, "");
const workloadTotal = (row: WorkloadRecord) =>
  [row.lectures, row.labs, row.practices, row.exams, row.credits, row.course_projects, row.consultations, row.seminars, row.diploma_students, row.practice_hours, row.postgraduates]
    .reduce<number>((sum, value) => sum + number(value), 0);
const hours = (value: number) => new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(value);

export default function Workload() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("vacancies");
  const [year, setYear] = useState("2026/2027");
  const [studyForm, setStudyForm] = useState<StudyForm>("Денна");
  const [teacherId, setTeacherId] = useState<number | "">("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [workloads, setWorkloads] = useState<WorkloadRecord[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [vacanciesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vacancyStep, setVacancyStep] = useState<1 | 2>(1);
  const [adjustStep, setAdjustStep] = useState<1 | 2>(1);
  const [reportVisible, setReportVisible] = useState(false);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [role] = useState(() => localStorage.getItem("userRole") ?? "Лаборант");
  const [profileName] = useState(currentUserName);
  const canEditDisciplines = role.toLocaleLowerCase("uk-UA").includes("лаборант");
  const [selectedImportFile, setSelectedImportFile] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importVersion, setImportVersion] = useState(0);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadCoreData = async () => {
      setLoading(true);
      setError(null);
      const [teacherResult, disciplineResult, workloadResult] = await Promise.all([
        supabase.from("Викладач").select("*").order("ПІБ"),
        supabase.from("Дисципліни").select("*"),
        supabase.from("Завантаження_навантаження").select("*").eq("Рік", year),
      ]);
      const firstError = teacherResult.error ?? disciplineResult.error ?? workloadResult.error;
      if (firstError) setError(firstError.message);
      else {
        const nextTeachers = (teacherResult.data ?? []).map((teacher, index) => ({ id: index + 1, name: String(teacher["ПІБ"] ?? "Без імені"), position: String(teacher["Вчене_звання"] ?? "Викладач"), rate: 1 })) as Teacher[];
        setTeachers(nextTeachers);
        setDisciplines((disciplineResult.data ?? []).map((discipline, index) => ({ id: index + 1, name: String(discipline["Назва_дисципліни"] ?? "Без назви"), hours: 0, semester: 0 })) as Discipline[]);
        setWorkloads((workloadResult.data ?? []).map((workload, index) => ({ id: index + 1, teacher_id: 0, discipline_name: "Навчальне навантаження", groups: "—", academic_year: String(workload["Рік"] ?? year), study_form: "Денна", lectures: number(workload["Лекції"]), labs: number(workload["Лабораторні_заняття"]), practices: number(workload["Практичні_заняття"]), seminars: number(workload["Семінарські_заняття"]), exams: number(workload["Екзамен"]), credits: number(workload["Залік"]), course_projects: number(workload["Курсовий_проект"]) })) as WorkloadRecord[]);
        setTeacherId((current) => current || nextTeachers[0]?.id || "");
      }
      setLoading(false);
    };
    void loadCoreData();
  }, [year, importVersion]);

  const selectedTeacher = teachers.find((teacher) => teacher.id === teacherId);
  const teacherLoads = useMemo(() => workloads.filter((row) => row.teacher_id === teacherId && row.study_form === studyForm), [workloads, teacherId, studyForm]);
  const totalVolume = workloads.reduce<number>((sum, row) => sum + workloadTotal(row), 0) + vacancies.reduce<number>((sum, row) => sum + number(row.hours), 0);
  const assignedHours = workloads.reduce<number>((sum, row) => sum + workloadTotal(row), 0);
  const vacancyHours = vacancies.reduce<number>((sum, row) => sum + number(row.hours), 0);

  const assignVacancy = async (vacancy: Vacancy) => {
    setAssigningId(vacancy.id);
    setError(null);
    // The vacancy may also be linked to a teacher here: .update({ is_assigned: true, teacher_id: teacherId })
    const { error: updateError } = await supabase.from("vacancies").update({ is_assigned: true }).eq("id", vacancy.id);
    if (updateError) setError(updateError.message);
    else setVacancies((current) => current.filter((item) => item.id !== vacancy.id));
    setAssigningId(null);
  };

  const changeTab = (tab: Tab) => {
    setActiveTab(tab);
    setAdjustStep(1);
    setVacancyStep(1);
    setReportVisible(false);
  };

  const selectImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedImportFile(file.name);
    setImporting(true);
    setImportMessage(null);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) throw new Error("У файлі не знайдено жодного аркуша.");
      const rawRows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: "" });
      const isWorkPlan = rawRows.slice(0, 7).flat().some((cell) => String(cell).includes("Витяг із робочих навчальних планів"));
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
      if (!rawRows.length) throw new Error("Обраний аркуш не містить рядків з даними.");
      const result = isWorkPlan ? await importStudyPlan(rawRows) : await importWorkbookRows(rows);
      setImportMessage(`Імпорт завершено: викладачів — ${result.teachers}, дисциплін — ${result.disciplines}, записів навантаження — ${result.workloads}.`);
      setImportVersion((version) => version + 1);
    } catch (importError) {
      setImportMessage(importError instanceof Error ? importError.message : "Не вдалося обробити файл.");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const importStudyPlan = async (rows: unknown[][]): Promise<ImportResult> => {
    const title = rows.slice(0, 7).flat().map(String).join(" ");
    const yearFromFile = title.match(/20\d{2}\s*\/\s*20\d{2}/)?.[0].replace(/\s/g, "") ?? year;
    const numeric = (value: unknown) => Number(String(value ?? "").replace(",", ".")) || 0;
    const records = rows.slice(6).map((row) => ({
      discipline: String(row[1] ?? "").trim(), department: String(row[2] ?? "").trim(),
      lecture: numeric(row[15]), practice: numeric(row[17]), seminar: numeric(row[19]), lab: numeric(row[21]),
      exam: numeric(row[22]), credit: numeric(row[23]), courseProject: numeric(row[26]), total: numeric(row[13]),
    })).filter((row) => row.discipline && row.department && row.total > 0);
    if (!records.length) throw new Error("У файлі не знайдено рядків навчального плану. Оберіть аркуш із дисциплінами.");

    const disciplinesToUpsert = [...new Map(records.map((row, index) => {
      // `Код_дисципліни` in Supabase is character(3); P01, P02… fits exactly.
      const code = `P${(index + 1).toString(36).toUpperCase().padStart(2, "0")}`;
      return [code, { "Код_дисципліни": code, "Код_кафедри": row.department, "Назва_дисципліни": row.discipline }];
    })).values()];
    const { error: disciplinesError } = await supabase.from("Дисципліни").upsert(disciplinesToUpsert, { onConflict: "Код_дисципліни" });
    if (disciplinesError) throw new Error(`Дисципліни: ${disciplinesError.message}`);

    const workloads = records.map((row) => ({ "Рік": yearFromFile, "Код_кафедри": row.department, "Код_форми_навчання": "Д", "Код_рівня_навчання": "Б", "Лекції": row.lecture, "Лабораторні_заняття": row.lab, "Практичні_заняття": row.practice, "Семінарські_заняття": row.seminar, "Екзамен": row.exam, "Залік": row.credit, "Курсовий_проект": row.courseProject }));
    const { error: workloadsError } = await supabase.from("Завантаження_навантаження").insert(workloads);
    if (workloadsError) throw new Error(`Навантаження: ${workloadsError.message}`);
    return { teachers: 0, disciplines: disciplinesToUpsert.length, workloads: workloads.length };
  };

  const importWorkbookRows = async (rows: Record<string, unknown>[]): Promise<ImportResult> => {
    const read = (row: Record<string, unknown>, ...names: string[]) => {
      const key = Object.keys(row).find((column) => names.some((name) => normalizeColumn(column) === normalizeColumn(name)));
      return key ? row[key] : "";
    };
    const text = (value: unknown) => String(value ?? "").trim();
    const teachersToUpsert = rows.map((row) => ({
      "Код_викладача": text(read(row, "Код_викладача", "код викладача", "teacher_id")),
      "ПІБ": text(read(row, "ПІБ", "Викладач", "teacher_name")),
      "Вчене_звання": text(read(row, "Вчене_звання", "Вчене звання")),
      "Науковий_ступінь": text(read(row, "Науковий_ступінь", "Науковий ступінь")),
      "Телефон_викладача": text(read(row, "Телефон_викладача", "Телефон")),
      "Email_викладача": text(read(row, "Email_викладача", "Email", "E-mail")),
    })).filter((teacher) => teacher["Код_викладача"] && teacher["ПІБ"]);
    const disciplinesToUpsert = rows.map((row) => ({
      "Код_дисципліни": text(read(row, "Код_дисципліни", "код дисципліни", "discipline_id")),
      "Код_кафедри": text(read(row, "Код_кафедри", "код кафедри", "department_id")),
      "Назва_дисципліни": text(read(row, "Назва_дисципліни", "Дисципліна", "Назва дисципліни")),
    })).filter((discipline) => discipline["Код_дисципліни"] && discipline["Код_кафедри"] && discipline["Назва_дисципліни"]);
    const workloadColumns = ["Рік", "Код_кафедри", "Код_форми_навчання", "Код_рівня_навчання", "Лекції", "Лабораторні_заняття", "Практичні_заняття", "Семінарські_заняття", "Екзамен", "Залік", "Курсовий_проект"];
    const workloadsToInsert: Record<string, unknown>[] = rows.map((row) => {
      const workload = Object.fromEntries(workloadColumns.map((column) => [column, read(row, column)])) as Record<string, unknown>;
      return Object.fromEntries(Object.entries(workload).filter(([, value]) => text(value) !== "")) as Record<string, unknown>;
    }).filter((workload) => text(workload["Рік"]) && text(workload["Код_кафедри"]));

    if (!teachersToUpsert.length && !disciplinesToUpsert.length && !workloadsToInsert.length) {
      throw new Error("Не знайдено потрібних колонок. Додайте у файл, наприклад: «Код_викладача», «ПІБ», «Код_дисципліни», «Назва_дисципліни», «Рік».");
    }
    if (teachersToUpsert.length) {
      const { error: teacherError } = await supabase.from("Викладач").upsert(teachersToUpsert, { onConflict: "Код_викладача" });
      if (teacherError) throw new Error(`Викладачі: ${teacherError.message}`);
    }
    if (disciplinesToUpsert.length) {
      const { error: disciplineError } = await supabase.from("Дисципліни").upsert(disciplinesToUpsert, { onConflict: "Код_дисципліни" });
      if (disciplineError) throw new Error(`Дисципліни: ${disciplineError.message}`);
    }
    if (workloadsToInsert.length) {
      const { error: workloadError } = await supabase.from("Завантаження_навантаження").insert(workloadsToInsert);
      if (workloadError) throw new Error(`Навантаження: ${workloadError.message}`);
    }
    return { teachers: teachersToUpsert.length, disciplines: disciplinesToUpsert.length, workloads: workloadsToInsert.length };
  };

  const downloadImportTemplate = () => {
    const sheet = XLSX.utils.json_to_sheet([{ "Код_викладача": "В001", "ПІБ": "Іваненко Іван Іванович", "Код_дисципліни": "Д001", "Код_кафедри": "КН", "Назва_дисципліни": "Програмування", "Рік": year, "Код_форми_навчання": "Д", "Код_рівня_навчання": "Б", "Лекції": 30, "Лабораторні_заняття": 30, "Практичні_заняття": 0, "Семінарські_заняття": 0, "Екзамен": 6, "Залік": 0, "Курсовий_проект": 0 }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Імпорт");
    XLSX.writeFile(workbook, "Шаблон_імпорту_навантаження.xlsx");
  };

  return (
    <div className="dashboard-container">
      <AppSidebar active="workload" />
      <aside className="sidebar legacy-sidebar">
        <div className="sidebar-brand"><img src={logo} alt="НУБіП" className="sidebar-logo" /><div><h3>НУБіП</h3><p>Система управління</p></div></div>
        <nav className="sidebar-menu">
          <button type="button" className="menu-item" onClick={() => navigate("/dashboard")}><FiGrid /> Головна</button>
          <span className="menu-category">Управління</span>
          <button type="button" className="menu-item active"><FiBookOpen /> Навантаження</button>
          <button type="button" className="menu-item" onClick={() => navigate("/teachers")}><FiUsers /> Викладачі</button>
          <button type="button" className="menu-item" onClick={() => navigate("/department")}><FiGrid /> Кафедра</button>
          <span className="menu-category">Додатково</span>
          <button type="button" className="menu-item" onClick={() => navigate("/help")}><FiHelpCircle /> Довідка</button>
        </nav>
        <div className="sidebar-profile"><div className="profile-info"><div className="profile-avatar-placeholder"><FiUsers /></div><div><h4>{profileName}</h4><p>{role}</p></div><FiChevronDown className="profile-arrow" /></div><button className="btn-logout" onClick={() => { localStorage.removeItem("userRole"); localStorage.removeItem("userDisplayName"); localStorage.removeItem("userEmail"); void supabase.auth.signOut(); navigate("/"); }}><FiLogOut /> Вийти</button></div>
      </aside>
      <main className="main-content">
        <input ref={importInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={selectImportFile} />
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="header-left"><span className="welcome-text">Вітаємо, {profileName}</span><h2>Кафедра Комп&apos;ютерних Наук</h2><p className="role-sub">{role}</p></div>
          </div>
          <div className="header-right"><button type="button" className="btn-import-workload" onClick={downloadImportTemplate}>Шаблон</button><button type="button" className="btn-import-workload" disabled={importing} onClick={() => importInputRef.current?.click()}><FiClipboard /> {importing ? "Імпорт…" : "Імпорт Excel"}</button><span className="notification-icon"><FiBell /><span className="dot" /></span><label className="academic-year"><strong>{year} навчальний рік</strong>
            <select className="date-badge" value={year} onChange={(event) => setYear(event.target.value)}>
              {YEARS.map((item) => <option key={item} value={item}>{item} навч. рік</option>)}
            </select>
          </label></div>
        </header>

        {selectedImportFile && <div className="import-file-notice">Вибрано файл: <strong>{selectedImportFile}</strong>. {importMessage ?? "Підготовка до імпорту…"}</div>}

        <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Загальний обсяг" value={`${hours(totalVolume)} год`} />
          <StatCard label="Розподілено" value={`${hours(assignedHours)} год`} color="text-emerald-600" />
          <StatCard label="Вакантні години" value={`${hours(vacancyHours)} год`} color="text-amber-600" />
          <StatCard label="Штатних НПП" value={`${teachers.length} осіб`} />
        </section>

        <nav className="window-tabs-navigation" aria-label="Розділи навантаження">
          {TAB_ITEMS.map(({ key, label, icon }) => (
            <button key={key} onClick={() => changeTab(key)} className={`tab-navigation-btn ${activeTab === key ? "active-tab" : ""}`}><span>{icon}</span>{label}</button>
          ))}
        </nav>

        {activeTab === "disciplines" && canEditDisciplines && <div className="discipline-edit-action"><button className="btn-import-workload" onClick={() => navigate("/disciplines")}>Редагувати дисципліни</button></div>}

        {error && <div role="alert" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Дані для цього розділу ще не підключено. Перевірте наявність таблиць у Supabase.</div>}
        {loading && <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">Завантаження даних…</div>}
        {!loading && activeTab === "adjust" && <AdjustTab teachers={teachers} teacherId={teacherId} setTeacherId={setTeacherId} studyForm={studyForm} setStudyForm={setStudyForm} year={year} step={adjustStep} setStep={setAdjustStep} records={teacherLoads} />}
        {!loading && activeTab === "report" && <ReportTab teachers={teachers} teacherId={teacherId} setTeacherId={setTeacherId} year={year} records={teacherLoads} visible={reportVisible} setVisible={setReportVisible} selectedTeacher={selectedTeacher} />}
        {!loading && activeTab === "form56" && <Form56Tab teachers={teachers} records={workloads} />}
        {!loading && activeTab === "vacancies" && <VacanciesTab step={vacancyStep} setStep={setVacancyStep} year={year} studyForm={studyForm} setStudyForm={setStudyForm} vacancies={vacancies} loading={vacanciesLoading} assigningId={assigningId} onAssign={assignVacancy} />}
        {!loading && activeTab === "disciplines" && <DisciplinesTab disciplines={disciplines} teachers={teachers} />}
      </main>
    </div>
  );
}


function StatCard({ label, value, color = "text-slate-900" }: { label: string; value: string; color?: string }) { return <article className="metric-card"><div className="metric-icon blue"><FiClipboard /></div><div className="metric-info"><p>{label}</p><h3 className={color}>{value}</h3><span className="sub-stat">за обраний навчальний рік</span></div></article>; }
function Card({ children }: { children: React.ReactNode }) { return <section className="custom-card-window rounded-[10px] border border-slate-200 bg-white p-5 sm:p-6">{children}</section>; }
function FormSelect({ label, value, onChange, children }: { label: string; value: string | number; onChange: (value: string) => void; children: React.ReactNode }) { return <label className="block text-sm font-medium text-slate-700">{label}<select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>; }
function TeacherOptions({ teachers }: { teachers: Teacher[] }) { return <>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</>; }
function EmptyRow({ columns, message }: { columns: number; message: string }) { return <tr><td colSpan={columns} className="px-4 py-10 text-center text-sm text-slate-500">{message}</td></tr>; }

function AdjustTab(props: { teachers: Teacher[]; teacherId: number | ""; setTeacherId: (id: number | "") => void; studyForm: StudyForm; setStudyForm: (form: StudyForm) => void; year: string; step: 1 | 2; setStep: (step: 1 | 2) => void; records: WorkloadRecord[] }) {
  const firstSemester = props.records.filter((row) => row.semester === 1).reduce<number>((sum, row) => sum + workloadTotal(row), 0);
  const secondSemester = props.records.filter((row) => row.semester === 2).reduce<number>((sum, row) => sum + workloadTotal(row), 0);
  if (props.step === 1) return <Card><div className="mx-auto max-w-xl"><h2 className="text-lg font-bold text-slate-900">Додати / зменшити навантаження</h2><p className="mt-1 text-sm text-slate-500">Оберіть параметри для перегляду розподілу викладача.</p><div className="mt-6 grid gap-4"><FormSelect label="Викладач" value={props.teacherId} onChange={(value) => props.setTeacherId(Number(value))}><TeacherOptions teachers={props.teachers} /></FormSelect><FormSelect label="Навчальний рік" value={props.year} onChange={() => {}}><option>{props.year}</option></FormSelect><FormSelect label="Форма навчання" value={props.studyForm} onChange={(value) => props.setStudyForm(value as StudyForm)}><option>Денна</option><option>Заочна</option></FormSelect><button className={`${primaryButton} mt-2`} onClick={() => props.setStep(2)}>Далі</button></div></div></Card>;
  return <Card><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold">Розподіл годин</h2><p className="text-sm text-slate-500">Деталізація обраного викладача</p></div><button className="text-sm font-semibold text-blue-600" onClick={() => props.setStep(1)}>Назад</button></div><LoadTable records={props.records} /><div className="mt-5 grid gap-3 sm:grid-cols-3"><Summary label="I семестр" value={firstSemester} /><Summary label="II семестр" value={secondSemester} /><Summary label="Всього" value={firstSemester + secondSemester || props.records.reduce<number>((sum, row) => sum + workloadTotal(row), 0)} /></div></Card>;
}
function Summary({ label, value }: { label: string; value: number }) { return <div className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{hours(value)} год</p></div>; }
function LoadTable({ records }: { records: WorkloadRecord[] }) { return <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Дисципліна</th><th className="px-4 py-3">Група</th><th className="px-4 py-3">Лекції</th><th className="px-4 py-3">Лаб.</th><th className="px-4 py-3">Практ.</th><th className="px-4 py-3">Всього</th></tr></thead><tbody className="divide-y divide-slate-100">{records.length ? records.map((row) => <tr key={row.id}><td className="px-4 py-3 font-medium text-slate-800">{row.discipline_name}</td><td className="px-4 py-3">{row.groups}</td><td className="px-4 py-3">{number(row.lectures)}</td><td className="px-4 py-3">{number(row.labs)}</td><td className="px-4 py-3">{number(row.practices)}</td><td className="px-4 py-3 font-semibold">{hours(workloadTotal(row))} год</td></tr>) : <EmptyRow columns={6} message="За обраними фільтрами записів немає." />}</tbody></table></div>; }
function ReportTab(props: { teachers: Teacher[]; teacherId: number | ""; setTeacherId: (id: number | "") => void; year: string; records: WorkloadRecord[]; visible: boolean; setVisible: (visible: boolean) => void; selectedTeacher?: Teacher }) { return <Card><div className="flex flex-col gap-4 sm:flex-row sm:items-end"><div className="flex-1"><FormSelect label="Викладач" value={props.teacherId} onChange={(value) => props.setTeacherId(Number(value))}><TeacherOptions teachers={props.teachers} /></FormSelect></div><div className="flex-1"><FormSelect label="Рік" value={props.year} onChange={() => {}}><option>{props.year}</option></FormSelect></div><button className={primaryButton} onClick={() => props.setVisible(true)}>Показати звіт</button></div>{props.visible && <div className="mt-7"><h2 className="text-lg font-bold text-slate-900">Педагогічне навантаження</h2><p className="mb-4 text-sm text-slate-500">{props.selectedTeacher?.name ?? "Викладач"} · {props.selectedTeacher?.position}</p><LoadTable records={props.records} /></div>}</Card>; }
function Form56Tab({ teachers, records }: { teachers: Teacher[]; records: WorkloadRecord[] }) { return <Card><h2 className="mb-5 text-lg font-bold text-slate-900">Форма 56 — виконання навчальної роботи</h2><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Викладач</th><th className="px-4 py-3">Посада</th><th className="px-4 py-3">Ставка</th><th className="px-4 py-3">Лекції</th><th className="px-4 py-3">Лабораторні</th><th className="px-4 py-3">Практичні</th><th className="px-4 py-3">Разом</th></tr></thead><tbody className="divide-y divide-slate-100">{teachers.map((teacher) => { const rows = records.filter((row) => row.teacher_id === teacher.id); return <tr key={teacher.id}><td className="px-4 py-3 font-medium">{teacher.name}</td><td className="px-4 py-3">{teacher.position}</td><td className="px-4 py-3">{teacher.rate}</td><td className="px-4 py-3">{rows.reduce<number>((sum, row) => sum + number(row.lectures), 0)}</td><td className="px-4 py-3">{rows.reduce<number>((sum, row) => sum + number(row.labs), 0)}</td><td className="px-4 py-3">{rows.reduce<number>((sum, row) => sum + number(row.practices), 0)}</td><td className="px-4 py-3 font-bold">{hours(rows.reduce<number>((sum, row) => sum + workloadTotal(row), 0))} год</td></tr>; })}</tbody></table></div></Card>; }
function VacanciesTab(props: { step: 1 | 2; setStep: (step: 1 | 2) => void; year: string; studyForm: StudyForm; setStudyForm: (form: StudyForm) => void; vacancies: Vacancy[]; loading: boolean; assigningId: number | null; onAssign: (vacancy: Vacancy) => void }) { if (props.step === 1) return <Card><div className="mx-auto max-w-md py-3"><h2 className="text-center text-xl font-bold text-slate-900">Вакансії</h2><p className="mt-1 text-center text-sm text-slate-500">Оберіть параметри для пошуку вакантного навантаження.</p><div className="mt-6 grid gap-4"><FormSelect label="Навчальний рік" value={props.year} onChange={() => {}}><option>{props.year}</option></FormSelect><FormSelect label="Форма навчання" value={props.studyForm} onChange={(value) => props.setStudyForm(value as StudyForm)}><option>Денна</option><option>Заочна</option></FormSelect><div className="mt-2 flex gap-3"><button className={`flex-1 ${primaryButton}`} onClick={() => props.setStep(2)}>Далі</button><button className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" onClick={() => props.setStep(1)}>Відмінити</button></div></div></div></Card>; return <Card><div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold">Вакантне навантаження</h2><p className="text-sm text-slate-500">{props.year} · {props.studyForm} форма</p></div><button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50" onClick={() => props.setStep(1)}>Назад</button></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Назва навчальної дисципліни</th><th className="px-4 py-3">Група / потік</th><th className="px-4 py-3">Тип роботи</th><th className="px-4 py-3">Години</th><th className="px-4 py-3">Дія</th></tr></thead><tbody className="divide-y divide-slate-100">{props.loading ? <EmptyRow columns={5} message="Завантаження вакансій…" /> : props.vacancies.length ? props.vacancies.map((vacancy) => <tr key={vacancy.id}><td className="px-4 py-3 font-medium text-slate-800">{vacancy.discipline_name}</td><td className="px-4 py-3">{vacancy.group_code}</td><td className="px-4 py-3">{vacancy.work_type}</td><td className="px-4 py-3 font-bold text-red-600">{hours(number(vacancy.hours))} год</td><td className="px-4 py-3"><button disabled={props.assigningId === vacancy.id} className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50" onClick={() => props.onAssign(vacancy)}>{props.assigningId === vacancy.id ? "Збереження…" : "Призначити"}</button></td></tr>) : <EmptyRow columns={5} message="Вакантного навантаження не знайдено." />}</tbody></table></div></Card>; }
function DisciplinesTab({ disciplines, teachers }: { disciplines: Discipline[]; teachers: Teacher[] }) { return <Card><h2 className="mb-5 text-lg font-bold text-slate-900">Усі дисципліни кафедри</h2><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Дисципліна</th><th className="px-4 py-3">Семестр</th><th className="px-4 py-3">Години</th><th className="px-4 py-3">Закріплений викладач</th></tr></thead><tbody className="divide-y divide-slate-100">{disciplines.length ? disciplines.map((discipline) => <tr key={discipline.id}><td className="px-4 py-3 font-medium">{discipline.name}</td><td className="px-4 py-3">{discipline.semester}</td><td className="px-4 py-3">{hours(number(discipline.hours))}</td><td className="px-4 py-3">{teachers.find((teacher) => teacher.id === discipline.teacher_id)?.name ?? "Не призначено"}</td></tr>) : <EmptyRow columns={4} message="Дисциплін за цей навчальний рік немає." />}</tbody></table></div></Card>; }
