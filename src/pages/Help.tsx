import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBookOpen, FiChevronDown, FiFileText, FiHelpCircle, FiHome, FiUpload, FiUsers } from "react-icons/fi";
import AppSidebar from "../components/AppSidebar";
import "../styles/HelpTour.css";

const steps = [
  { icon: <FiHome />, title: "Головна", text: "Натисніть «Головна» у лівому меню. Тут показано загальний стан кафедри: кількість викладачів, сумарне навантаження та кількість дисциплін. Діаграми доступні лише завідувачу кафедри; лаборант і викладач бачать основні показники без аналітики." },
  { icon: <FiBookOpen />, title: "Навантаження", text: "У розділі «Навантаження» оберіть навчальний рік, працюйте з розподілом годин, звітами, вакансіями та дисциплінами. Лаборант може імпортувати Excel і редагувати дані, завідувач — переглядати." },
  { icon: <FiUpload />, title: "Імпорт Excel", text: "У «Навантаженні» натисніть «Імпорт Excel», виберіть файл навчального плану з комп’ютера та дочекайтеся повідомлення про результат. Імпорт переносить дисципліни й години до бази даних." },
  { icon: <FiUsers />, title: "Викладачі", text: "Відкрийте «Викладачі», у меню «Викладач» виберіть «Додати», «Редагувати» або «Переглянути». Лаборант керує записами, завідувач має режим перегляду." },
  { icon: <FiHome />, title: "Кафедра", text: "Відкрийте «Кафедра» під пунктом «Викладачі». Знайдіть кафедру за кодом або назвою, натисніть «Редагувати» та змініть контактні дані. Створення кафедр тут вимкнене." },
  { icon: <FiBookOpen />, title: "Дисципліни", text: "У вкладці «Дисципліни» розділу навантаження відкрийте довідник. Перед додаванням дисципліни переконайтеся, що її код кафедри вже є в таблиці «Кафедра»." },
  { icon: <FiFileText />, title: "Документи й ролі", text: "Викладач працює зі своїми документами. Лаборант редагує кафедральні дані, викладачів, дисципліни та навантаження. Завідувач переглядає дані й аналітику без редагування." },
];

export default function Help() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<number | null>(0);
  return <div className="app-shell"><AppSidebar active="help" /><main className="help-tour app-shell-main"><header><div><p>Довідка користувача</p><h1>Як користуватися системою</h1></div><button onClick={() => navigate("/dashboard")}>Перейти на головну</button></header><section className="help-role"><strong>Почніть з вибору потрібного пункту в лівому меню.</strong><span>Лаборант — керує даними</span><span>Викладач — працює з документами</span><span>Завідувач — переглядає аналітику</span></section><section className="help-steps">{steps.map((step, index) => <article key={step.title} className={open === index ? "open" : ""}><button onClick={() => setOpen(open === index ? null : index)}><span>{step.icon}</span><b>Крок {index + 1}. {step.title}</b><FiChevronDown /></button>{open === index && <p>{step.text}</p>}</article>)}</section><footer><FiHelpCircle /> Якщо виникла помилка доступу до бази, вийдіть і увійдіть знову, щоб оновилася сесія Supabase.</footer></main></div>;
}
