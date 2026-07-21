import "../styles/Reports.css";
import logo from "../assets/images/logo.png";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome, FaBriefcase, FaGraduationCap, FaBookOpen, FaChartBar,
  FaUsers, FaSignOutAlt, FaSearch, FaDownload, FaFileAlt, FaCheckCircle, 
  FaExclamationTriangle, FaFilter, FaCalendarAlt, FaInfoCircle, FaQuestionCircle
} from "react-icons/fa";
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from "recharts";

const workloadData = [
  { name: "Шевченко", план: 450, факт: 210 },
  { name: "Іваненко", план: 620, факт: 340 },
  { name: "Петренко", план: 710, факт: 450 },
  { name: "Коваленко", план: 510, факт: 290 },
  { name: "Сидоренко", план: 480, факт: 200 },
  { name: "Бондаренко", plan: 320, факт: 150 },
];

const typeDistribution = [
  { name: 'Лекції', value: 400, color: '#0f172a' },
  { name: 'Лаб. роботи', value: 600, color: '#2563eb' },
  { name: 'Практичні', value: 340, color: '#38bdf8' },
  { name: 'Семінари', value: 105, color: '#cbd5e1' },
];

const initialReportsList = [
  { id: "REP-01", name: "Виконання навантаження кафедри", type: "Аналітика", date: "2026-07-08", status: "Готовий" },
  { id: "REP-02", name: "Аудит силабусів та ЕНК", type: "Методична", date: "2026-07-07", status: "Готовий" },
  { id: "REP-03", name: "Кадровий звіт (Кваліфікація)", type: "Кадри", date: "2026-07-01", status: "Готовий" },
  { id: "REP-04", name: "Наукова активність НПП", type: "Наукова", date: "2026-06-28", status: "Оновлюється" },
  { id: "REP-05", name: "Розподіл вибіркових дисциплін", type: "Плани", date: "2026-06-15", status: "Архів" },
];

function Reports() {
  const navigate = useNavigate();
  const [role, setRole] = useState<string>("Завідувач кафедри");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("Всі типи");
  const [selectedStatus, setSelectedStatus] = useState<string>("Всі статуси");
  
  const [startDate, setStartDate] = useState<string>("2026-01-01");
  const [endDate, setEndDate] = useState<string>("2026-12-31");

  useEffect(() => {
    const savedRole = localStorage.getItem("userRole");
    if (savedRole) setRole(savedRole);
  }, []);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}.${month}.${year}`;
  };

  const filteredReports = initialReportsList.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "Всі типи" || r.type === selectedType;
    const matchesStatus = selectedStatus === "Всі статуси" || r.status === selectedStatus;
    
    const reportTime = new Date(r.date).getTime();
    const startConfirm = startDate ? reportTime >= new Date(startDate).getTime() : true;
    const endConfirm = endDate ? reportTime <= new Date(endDate).getTime() : true;

    return matchesSearch && matchesType && matchesStatus && startConfirm && endConfirm;
  });

  const getStatusClass = (status: string) => {
    if (status === 'Готовий') return 'ok';
    if (status === 'Оновлюється') return 'wait';
    return 'archive';
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src={logo} alt="НУБіП" className="sidebar-logo" />
          <div className="brand-text"><h3>НУБіП</h3><p>Аналітика та звіти</p></div>
        </div>
        <nav className="sidebar-menu">
          <a href="#" onClick={() => navigate("/dashboard")} className="menu-item"><FaHome /> <span>Головна</span></a>
          <span className="menu-category">Управління</span>
          <a href="#" onClick={() => navigate("/workload")} className="menu-item"><FaBriefcase /> <span>Навантаження</span></a>
          <a href="#" onClick={() => navigate("/teachers")} className="menu-item"><FaGraduationCap /> <span>Викладачі</span></a>
          <a href="#" onClick={() => navigate("/disciplines")} className="menu-item"><FaBookOpen /> Дисципліни</a>
          <span className="menu-category">Звітність</span>
          <a href="#" className="menu-item active"><FaChartBar /> <span>Звіти</span> <span className="badge">5</span></a>
          <a href="#" onClick={() => navigate("/help")} className="menu-item"><FaQuestionCircle /> Довідка</a>
        </nav>
        <div className="sidebar-profile">
          <div className="profile-info">
            <FaUsers className="avatar-icon" />
            <div className="p-text"><h4>Іваненко І. І.</h4><p>{role}</p></div>
          </div>
          <button className="btn-logout" onClick={() => { localStorage.removeItem("userRole"); navigate("/"); }}><FaSignOutAlt /> Вийти</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <div className="header-left">
            <h2>Аналітичні звіти кафедри</h2>
            <span className="welcome-text">Операційний моніторинг академічного навантаження 2025/2026</span>
          </div>
          <button className="btn-action-blue"><FaDownload /> Експортувати ZIP</button>
        </header>

        <section className="metrics-grid compact">
          <div className="metric-card">
            <FaFileAlt className="m-icon b" />
            <div className="metric-info">
              <p>Звітів згенеровано</p>
              <h3>42 <span>/ 50</span></h3>
              <div className="mini-progress"><div className="bar b" style={{width: '84%'}}></div></div>
            </div>
          </div>
          <div className="metric-card">
            <FaCheckCircle className="m-icon g" />
            <div className="metric-info">
              <p>Виконання плану</p>
              <h3>58.3%</h3>
              <div className="mini-progress"><div className="bar g" style={{width: '58.3%'}}></div></div>
            </div>
          </div>
          <div className="metric-card">
            <FaBookOpen className="m-icon p" />
            <div className="metric-info">
              <p>Затверджено силабусів</p>
              <h3>89.1%</h3>
              <div className="mini-progress"><div className="bar p" style={{width: '89.1%'}}></div></div>
            </div>
          </div>
          <div className="metric-card">
            <FaExclamationTriangle className="m-icon o" />
            <div className="metric-info">
              <p>Критичні помилки</p>
              <h3 className="red">3</h3>
              <div className="mini-progress"><div className="bar r" style={{width: '30%'}}></div></div>
            </div>
          </div>
        </section>

        <div className="reports-charts-grid compact-charts">
          <div className="chart-card">
            <h4 className="chart-title">Ефективність виконання плану (Факт vs План)</h4>
            <div className="chart-container-box">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={workloadData} margin={{top: 5, right: 10, left: -25, bottom: 0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{fontSize: '11px', borderRadius: '6px'}} />
                  <Legend iconType="circle" iconSize={6} wrapperStyle={{fontSize: '10px', paddingTop: '2px'}} />
                  <Bar dataKey="факт" name="Фактично" fill="#2563eb" radius={[3, 3, 0, 0]} barSize={12} />
                  <Line type="monotone" dataKey="план" name="Заплановано" stroke="#0f172a" strokeWidth={1.5} dot={{ r: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <h4 className="chart-title">Розподіл годин за видами робіт</h4>
            <div className="chart-container-box pie-adjust">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeDistribution} innerRadius="50%" outerRadius="72%" paddingAngle={3} dataKey="value">
                    {typeDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{fontSize: '11px', borderRadius: '6px'}} />
                  <Legend 
                    verticalAlign="bottom" 
                    align="center" 
                    layout="horizontal" 
                    iconType="circle"
                    iconSize={6} 
                    wrapperStyle={{fontSize: '10px', paddingTop: '2px'}} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="table-wrapper-card massive-table">
          <div className="table-filters-row">
            <div className="filters-left">
              <div className="search-box"><FaSearch /><input placeholder="Пошук документа..." onChange={(e) => setSearchTerm(e.target.value)} /></div>
              
              <div className="select-wrapper">
                <FaFilter className="filter-icon" />
                <select className="category-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                  <option value="Всі типу">Всі типи</option>
                  <option value="Аналітика">Аналітика</option>
                  <option value="Методична">Методична</option>
                  <option value="Кадри">Кадри</option>
                  <option value="Наукова">Наукова</option>
                  <option value="Плани">Плани</option>
                </select>
              </div>

              <div className="select-wrapper">
                <FaInfoCircle className="filter-icon" />
                <select className="category-select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="Всі статуси">Всі статуси</option>
                  <option value="Готовий">Готовий</option>
                  <option value="Оновлюється">Оновлюється</option>
                  <option value="Архів">Архів</option>
                </select>
              </div>

              <div className="date-picker-group">
                <FaCalendarAlt className="date-icon" />
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <span className="date-separator">—</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                {(startDate !== "2026-01-01" || endDate !== "2026-12-31") && (
                  <button className="btn-clear-date" onClick={() => { setStartDate("2026-01-01"); setEndDate("2026-12-31"); }}>Скинути</button>
                )}
              </div>
            </div>
            <span className="table-counter">Знайдено рядків: <b>{filteredReports.length}</b></span>
          </div>
          
          <div className="table-container">
            <table>
              <thead><tr><th>ID</th><th>Документ</th><th>Тип</th><th>Дата зміни</th><th>Статус</th><th>Дії</th></tr></thead>
              <tbody>
                {filteredReports.map((rep) => (
                  <tr key={rep.id}>
                    <td className="rep-id">{rep.id}</td>
                    <td className="rep-name">{rep.name}</td>
                    <td><span className="tag">{rep.type}</span></td>
                    <td>{formatDateDisplay(rep.date)}</td>
                    <td><span className={`status ${getStatusClass(rep.status)}`}>{rep.status}</span></td>
                    <td className="td-actions"><button className="btn-table-dl" title="Скачати файл"><FaDownload /></button></td>
                  </tr>
                ))}
                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="table-empty-state">Документів за вказаними критеріями не знайдено</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
export default Reports;