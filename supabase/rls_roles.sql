-- RLS-політики для реальних ролей проєкту:
-- admin, head, laborant, teacher.
-- Виконайте УВЕСЬ файл у Supabase Dashboard → SQL Editor.
-- Після виконання вийдіть із сайту та увійдіть знову, щоб JWT отримав актуальну роль.

create or replace function public.current_app_role()
returns text
language sql
stable
as $$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') $$;

create or replace function public.has_app_role(allowed_roles text[])
returns boolean
language sql
stable
as $$ select public.current_app_role() = any(allowed_roles) $$;

-- Вмикаємо RLS лише на таблицях, які реально існують у схемі.
-- Так файл не впаде, якщо у назві таблиці у вашій БД використано пробіл замість підкреслення.
do $$
declare
  table_name text;
  managed_tables text[] := array[
    'Архів', 'Навантаження', 'Кафедральна_інформація', 'Завантаження_навантаження',
    'Дисципліни', 'Посада', 'Статус_викладача', 'Тип_викладача', 'Форма_навчання',
    'Рівень_навчання', 'Завантажені_документи', 'Кафедра', 'Викладач',
    'Факультет_ННІ', 'Абревіатура', 'ОПП', 'Спеціальність'
  ];
  documents_tables text[] := array['Завантажені_документи'];
  laborant_write_tables text[] := array[
    'Архів', 'Навантаження', 'Кафедральна_інформація', 'Завантаження_навантаження',
    'Дисципліни', 'Завантажені_документи', 'Кафедра', 'Викладач'
  ];
begin
  foreach table_name in array managed_tables loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('drop policy if exists app_read on public.%I', table_name);
      execute format('drop policy if exists app_write on public.%I', table_name);

      -- Завідувач і лаборант читають усі робочі таблиці. Викладач читає лише
      -- кафедральну інформацію та документи. Адміністратор читає все.
      if table_name = any(documents_tables) then
        execute format('create policy app_read on public.%I for select to authenticated using (public.has_app_role(array[''admin'',''head'',''laborant'',''teacher'']))', table_name);
        execute format('create policy app_write on public.%I for all to authenticated using (public.has_app_role(array[''admin'',''laborant'',''teacher''])) with check (public.has_app_role(array[''admin'',''laborant'',''teacher'']))', table_name);
      elsif table_name = 'Кафедральна_інформація' then
        execute format('create policy app_read on public.%I for select to authenticated using (public.has_app_role(array[''admin'',''head'',''laborant'',''teacher'']))', table_name);
        execute format('create policy app_write on public.%I for all to authenticated using (public.has_app_role(array[''admin'',''laborant''])) with check (public.has_app_role(array[''admin'',''laborant'']))', table_name);
      else
        execute format('create policy app_read on public.%I for select to authenticated using (public.has_app_role(array[''admin'',''head'',''laborant'']))', table_name);
        if table_name = any(laborant_write_tables) then
          execute format('create policy app_write on public.%I for all to authenticated using (public.has_app_role(array[''admin'',''laborant''])) with check (public.has_app_role(array[''admin'',''laborant'']))', table_name);
        else
          execute format('create policy app_write on public.%I for all to authenticated using (public.has_app_role(array[''admin''])) with check (public.has_app_role(array[''admin'']))', table_name);
        end if;
      end if;
    end if;
  end loop;
end $$;

-- Перевірка: для користувача kn23-a.pavlyk роль уже встановлено коректно:
-- raw_app_meta_data.role = 'laborant'. Її змінювати не потрібно.
