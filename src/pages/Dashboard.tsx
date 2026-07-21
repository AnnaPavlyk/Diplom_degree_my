import "../styles/Dashboard.css";
import "../styles/UnifiedSidebar.css";
import logo from "../assets/images/logo.png";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { currentUserName } from "../utils/currentUser";
import AppSidebar from "../components/AppSidebar";
import {
  FaHome,
  FaBookOpen,
  FaGraduationCap,
  FaUsers,
  FaFileAlt,
  FaBell,
  FaChevronDown,
  FaSignOutAlt,
  FaQuestionCircle,
  FaArrowRight,
  FaBriefcase,
} from "react-icons/fa";

import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, PieChart, Pie, Cell 
} from "recharts";

interface LineDataItem {
  name: string;
  поточний: number;
  попередній: number;
}

const lineData: LineDataItem[] = [
  { name: "Вер", поточний: 2000, попередній: 1800 },
  { name: "Жов", поточний: 4500, попередній: 3900 },
  { name: "Лис", поточний: 5800, попередній: 5000 },
  { name: "Гру", поточний: 6200, попередній: 5500 },
  { name: "Січ", поточний: 7800, попередній: 6900 },
  { name: "Лют", поточний: 9200, попередній: 8100 },
  { name: "Бер", поточний: 14157.9, попередній: 11000 },
  { name: "Кві", поточний: 14800, попередній: 12100 },
  { name: "Тра", поточний: 15500, попередній: 12900 },
  { name: "Чер", поточний: 16200, попередній: 13500 },
];

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

const pieData: PieDataItem[] = [
  { name: "Лекції", value: 4520.0, color: "#3B82F6" },
  { name: "Практичні", value: 3890.0, color: "#10B981" },
  { name: "Лабораторні", value: 4115.0, color: "#8B5CF6" },
  { name: "Практика", value: 1632.9, color: "#F59E0B" }
];

interface DashboardProps {
  departmentName?: string;
}

function Dashboard({ departmentName = "Кафедра комп'ютерних наук" }: DashboardProps) {
  const navigate = useNavigate(); 
  const [role, setRole] = useState<string>(() => localStorage.getItem("userRole") ?? "Лаборант");
  const [profileName] = useState(currentUserName);

  useEffect(() => {
    const savedRole = localStorage.getItem("userRole");
    if (savedRole) {
      setRole(savedRole);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    navigate("/"); 
  };

  return (
    <div className="dashboard-container">
      <AppSidebar active="dashboard" />
      
      {/* ЛІВА ЧАСТИНА: SIDEBAR */}
      <aside className="sidebar legacy-sidebar">
        <div className="sidebar-brand">
          <img src={logo} alt="НУБіП Лого" className="sidebar-logo" />
          <div>
            <h3>НУБіП</h3>
            <p>Система управління</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button 
            type="button"
            className="menu-item active" 
            onClick={() => navigate("/dashboard")}
            style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
          >
            <FaHome /> Головна
          </button>

          <span className="menu-category">Управління</span>
          <button 
            type="button"
            className="menu-item" 
            onClick={() => navigate("/workload")}
            style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
          >
            <FaBriefcase /> Навантаження
          </button>
          
          <button 
            type="button"
            className="menu-item" 
            onClick={() => navigate("/teachers")}
            style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
          >
            <FaGraduationCap /> Викладачі
          </button>
          <button type="button" className="menu-item" onClick={() => navigate("/department")} style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}>
            <FaHome /> Кафедра
          </button>

          <span className="menu-category">Додатково</span>
          <button 
            type="button"
            onClick={() => navigate("/help")} 
            className="menu-item"
            style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
          >
            <FaQuestionCircle /> Довідка
          </button>
        </nav>

        <div className="sidebar-profile">
          <div className="profile-info">
            <div className="profile-avatar-placeholder">
              <FaUsers />
            </div>
            <div>
              <h4>{profileName}</h4>
              <p>{role}</p>
            </div>
            <FaChevronDown className="profile-arrow" />
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <FaSignOutAlt /> Вийти
          </button>
        </div>
      </aside>

      {/* ПРАВА ЧАСТИНА: ОСНОВНИЙ КОНТЕНТ */}
      <main className="main-content">
        
        <header className="main-header">
          <div className="header-left">
            <span className="welcome-text">Вітаємо, {profileName}</span>
            <h2>{departmentName}</h2>
            <p className="role-sub">{role}</p>
          </div>
          
          <div className="header-right">
            <div className="notification-icon">
              <FaBell />
              <span className="dot"></span>
            </div>
            <div className="academic-year">
              <strong>2025/2026 навчальний рік</strong>
              <div className="date-badge">01.09.2025 - 31.05.2026 <FaChevronDown /></div>
            </div>
          </div>
        </header>

        {/* СЕКЦІЯ 1: МЕТРИКИ */}
        <section className="metrics-grid">
          <div className="metric-card" onClick={() => navigate("/teachers")} style={{ cursor: "pointer" }}>
            <div className="metric-icon blue"><FaGraduationCap /></div>
            <div className="metric-info">
              <p>Викладачі</p>
              <h3>24</h3>
              <span className="sub-stat">штатні та сумісники <span className="trend-up">+2 ↗</span></span>
            </div>
          </div>

          <div className="metric-card" onClick={() => navigate("/workload")} style={{ cursor: "pointer" }}>
            <div className="metric-icon orange"><FaBriefcase /></div>
            <div className="metric-info">
              <p>Навантаження</p>
              <h3>14 157,9</h3>
              <span className="sub-stat">годин на рік <span className="trend-up">+1 245,6 ↗</span></span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon purple"><FaBookOpen /></div>
            <div className="metric-info">
              <p>Дисципліни</p>
              <h3>32</h3>
              <span className="sub-stat">на поточний рік <span className="trend-up">+3 ↗</span></span>
            </div>
          </div>
        </section>

        {/* СЕКЦІЯ 2: ГРАФІКИ */}
        <section className="charts-grid">
          <div className="chart-card main-chart">
            <div className="card-header">
              <h3>Динаміка навантаження</h3>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#9CA3AF" tickLine={false} style={{ fontSize: 11 }} />
                  <YAxis stroke="#9CA3AF" tickLine={false} style={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="поточний" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Поточний рік (год.)" />
                  <Line type="monotone" dataKey="попередній" stroke="#9CA3AF" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Попередній рік (год.)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card pie-chart-card">
            <div className="card-header stack-left">
              <h3>Розподіл навантаження</h3>
              <div className="select-wrapper">
                <select className="chart-select side-filter-btn">
                  <option>За видами занять</option>
                  <option>За кафедрами</option>
                  <option>За семестрами</option>
                </select>
              </div>
            </div>
            <div className="pie-content">
              <div className="pie-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={pieData} 
                      innerRadius={60} 
                      outerRadius={80} 
                      paddingAngle={4} 
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-center-text">
                  <h4>14 157,9</h4>
                  <p>годин</p>
                </div>
              </div>
              
              <ul className="pie-legend">
                {pieData.map((item, idx) => (
                  <li key={idx}>
                    <div className="legend-left">
                      <span className="dot-legend" style={{ backgroundColor: item.color }}></span>
                      <span className="legend-label">{item.name}</span>
                    </div>
                    <strong className="legend-value">{item.value.toLocaleString('uk-UA')} год.</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* СЕКЦІЯ 3: НИЖНЯ СІТКА */}
        <section className="details-grid">
          <div className="detail-card">
            <h3>Активність кафедри</h3>
            <ul className="activity-list">
              <li><span><FaFileAlt /> Проведено занять</span> <strong>256</strong></li>
              <li><span><FaFileAlt /> Опубліковано матеріалів</span> <strong>42</strong></li>
              <li><span><FaBookOpen /> Створено завдань</span> <strong>128</strong></li>
              <li><span><FaUsers /> Проведено консультацій</span> <strong>74</strong></li>
            </ul>
            <button 
              type="button" 
              onClick={() => navigate("/statistics")}
              className="card-footer-link-btn"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#2563EB", padding: 0, display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }}
            >
              Перейти до детальної статистики <FaArrowRight />
            </button>
          </div>

          <div className="detail-card">
            <div className="card-header">
              <h3>Популярні дисципліни</h3>
            </div>
            <ul className="popular-list">
              <li>
                <div className="list-info"><span>Бази даних</span> <span>1 240 год.</span></div>
                <div className="progress-bar"><div className="progress" style={{ width: "90%", backgroundColor: "#2563EB" }}></div></div>
              </li>
              <li>
                <div className="list-info"><span>Вебтехнології</span> <span>1 080 год.</span></div>
                <div className="progress-bar"><div className="progress" style={{ width: "80%", backgroundColor: "#2563EB" }}></div></div>
              </li>
              <li>
                <div className="list-info"><span>Інформаційні системи</span> <span>920 год.</span></div>
                <div className="progress-bar"><div className="progress" style={{ width: "68%", backgroundColor: "#2563EB" }}></div></div>
              </li>
              <li>
                <div className="list-info"><span>Програмування</span> <span>860 год.</span></div>
                <div className="progress-bar"><div className="progress" style={{ width: "62%", backgroundColor: "#2563EB" }}></div></div>
              </li>
            </ul>
          </div>

          <div className="detail-card">
            <h3>Швидкий доступ</h3>
            <div className="quick-actions-grid">
              <button className="action-btn" onClick={() => navigate("/teachers")}>
                <FaGraduationCap /> Список викладачів
              </button>
              <button className="action-btn" onClick={() => navigate("/workload")}>
                <FaBriefcase /> Навантаження кафедри
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default Dashboard;
