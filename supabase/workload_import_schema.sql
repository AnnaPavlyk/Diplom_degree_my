-- Виконайте один раз у Supabase Dashboard → SQL Editor.
-- Таблиця зберігає кожний рядок навчального плану окремо. Вона доповнює
-- «Завантаження_навантаження», де зберігаються тільки підсумки кафедри.

create table if not exists public."Розподіл_навчального_навантаження" (
  id uuid primary key default gen_random_uuid(),
  "Рік" varchar(9) not null,
  "Код_кафедри" bpchar not null references public."Кафедра"("Код_кафедри"),
  "Код_дисципліни" bpchar not null references public."Дисципліни"("Код_дисципліни"),
  "Група" varchar not null,
  "Семестр" integer not null default 0,
  "Лекції" numeric not null default 0,
  "Лабораторні_заняття" numeric not null default 0,
  "Практичні_заняття" numeric not null default 0,
  "Семінарські_заняття" numeric not null default 0,
  "Екзамен" numeric not null default 0,
  "Залік" numeric not null default 0,
  "Курсовий_проект" numeric not null default 0,
  "Всього_годин" numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique ("Рік", "Код_кафедри", "Код_дисципліни", "Група", "Семестр")
);

grant select, insert, update, delete on table public."Розподіл_навчального_навантаження" to authenticated;
alter table public."Розподіл_навчального_навантаження" enable row level security;

drop policy if exists app_read on public."Розподіл_навчального_навантаження";
drop policy if exists app_write on public."Розподіл_навчального_навантаження";
create policy app_read on public."Розподіл_навчального_навантаження"
  for select to authenticated
  using (public.has_app_role(array['admin','head','laborant']));
create policy app_write on public."Розподіл_навчального_навантаження"
  for all to authenticated
  using (public.has_app_role(array['admin','laborant']))
  with check (public.has_app_role(array['admin','laborant']));
