-- Виконайте один раз у Supabase Dashboard → SQL Editor.
-- Функція зберігає кафедральні дані викладача за назвами з форми, а не за
-- припущеннями про внутрішні коди довідників.

create or replace function public.save_teacher_department_info(
  p_teacher_code text,
  p_department_code text,
  p_position_name text,
  p_work_type_name text,
  p_status_code text,
  p_rate numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_position_code text;
  v_type_code text;
begin
  if not public.has_app_role(array['admin', 'laborant']) then
    raise exception 'Недостатньо прав для збереження кафедральної інформації';
  end if;

  select p."Код_посади" into v_position_code
  from public."Посада" p
  where lower(trim(coalesce(to_jsonb(p) ->> 'Назва', to_jsonb(p) ->> 'Назва_посади', to_jsonb(p) ->> 'Посада', ''))) = lower(trim(p_position_name))
  limit 1;
  if v_position_code is null then
    raise exception 'У таблиці «Посада» не знайдено значення «%»', p_position_name;
  end if;

  select t."Код_типу" into v_type_code
  from public."Тип_викладача" t
  where (
    lower(trim(coalesce(to_jsonb(t) ->> 'Назва_типу', to_jsonb(t) ->> 'Тип_викладача', ''))) = lower(trim(p_work_type_name))
    or (p_work_type_name = 'Основний' and t."Код_типу" = '1')
    or (p_work_type_name = 'Сумісник' and t."Код_типу" = '2')
  )
  limit 1;
  if v_type_code is null then
    raise exception 'У таблиці «Тип_викладача» не знайдено значення «%»', p_work_type_name;
  end if;

  update public."Кафедральна_інформація_про_виклад"
  set "Код_посади" = v_position_code,
      "Код_типу" = v_type_code,
      "Код_статусу_викладача" = p_status_code,
      "Частка_ставки" = p_rate
  where "Код_викладача" = p_teacher_code
    and "Код_кафедри" = p_department_code;

  if not found then
    insert into public."Кафедральна_інформація_про_виклад" (
      "Код_кафедри", "Код_викладача", "Код_статусу_викладача",
      "Код_посади", "Частка_ставки", "Код_типу"
    ) values (
      p_department_code, p_teacher_code, p_status_code,
      v_position_code, p_rate, v_type_code
    );
  end if;
end;
$$;

grant execute on function public.save_teacher_department_info(text, text, text, text, text, numeric) to authenticated;
