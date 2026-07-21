import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/RoleDashboard";
import Workload from "./pages/Workload"; 
import Teachers from "./pages/Teachers"; 
import Disciplines from "./pages/Disciplines"; 
import Reports from "./pages/Reports"; 
import Department from "./pages/Department";
import Help from "./pages/Help"; // Додали імпорт сторінки довідки

function App() {
  return (
    <Router>
      <Routes>
        {/* Головна сторінка входу */}
        <Route path="/" element={<Login />} />
        
        {/* Сторінка реєстрації */}
        <Route path="/register" element={<Register />} />

        {/* Головна сторінка дашборду */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Сторінка навчального навантаження */}
        <Route path="/workload" element={<Workload />} />

        {/* Сторінка викладачів */}
        <Route path="/teachers" element={<Teachers />} />

        {/* Сторінка дисциплін */}
        <Route path="/disciplines" element={<Disciplines />} />
        <Route path="/department" element={<Department />} />

        {/* Сторінка звітів */}
        <Route path="/reports" element={<Reports />} />

        {/* Нова сторінка довідки / інструкції користувача */}
        <Route path="/help" element={<Help />} />

        {/* Обробка помилки 404 */}
        <Route path="*" element={<h2 style={{ textAlign: "center", marginTop: "50px" }}>404 - Сторінку не знайдено</h2>} />
      </Routes>
    </Router>
  );
}

export default App;
