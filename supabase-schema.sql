create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    monthly_budget numeric(12, 2) not null default 250000,
    category_budgets jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

alter table public.profiles
    add column if not exists category_budgets jsonb not null default '{}'::jsonb;

create table if not exists public.expenses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    description text not null check (char_length(description) between 1 and 120),
    amount numeric(12, 2) not null check (amount > 0),
    category text not null check (category in ('Food', 'Bills', 'Transport', 'Shopping', 'Fun', 'Other')),
    expense_date date not null default current_date,
    created_at timestamptz not null default now()
);

create index if not exists expenses_user_date_idx on public.expenses (user_id, expense_date desc);

create table if not exists public.recurring_expenses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    description text not null check (char_length(description) between 1 and 60),
    amount numeric(12, 2) not null check (amount > 0),
    category text not null check (category in ('Food', 'Bills', 'Transport', 'Shopping', 'Fun', 'Other')),
    frequency text not null check (frequency in ('weekly', 'monthly')),
    due_day smallint not null check (due_day between 1 and 31),
    next_due_date date not null,
    created_at timestamptz not null default now()
);

alter table public.recurring_expenses
    add column if not exists due_day smallint check (due_day between 1 and 31);

update public.recurring_expenses
set due_day = extract(day from next_due_date)::smallint
where due_day is null;

alter table public.recurring_expenses
    alter column due_day set not null;

create index if not exists recurring_expenses_user_due_idx on public.recurring_expenses (user_id, next_due_date);

alter table public.profiles enable row level security;
alter table public.expenses enable row level security;
alter table public.recurring_expenses enable row level security;

drop policy if exists "Users can read their profile" on public.profiles;
create policy "Users can read their profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can create their profile" on public.profiles;
create policy "Users can create their profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can read their expenses" on public.expenses;
create policy "Users can read their expenses" on public.expenses for select using (auth.uid() = user_id);

drop policy if exists "Users can create their expenses" on public.expenses;
create policy "Users can create their expenses" on public.expenses for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their expenses" on public.expenses;
create policy "Users can update their expenses" on public.expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their expenses" on public.expenses;
create policy "Users can delete their expenses" on public.expenses for delete using (auth.uid() = user_id);

drop policy if exists "Users can read their recurring expenses" on public.recurring_expenses;
create policy "Users can read their recurring expenses" on public.recurring_expenses for select using (auth.uid() = user_id);

drop policy if exists "Users can create their recurring expenses" on public.recurring_expenses;
create policy "Users can create their recurring expenses" on public.recurring_expenses for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their recurring expenses" on public.recurring_expenses;
create policy "Users can update their recurring expenses" on public.recurring_expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their recurring expenses" on public.recurring_expenses;
create policy "Users can delete their recurring expenses" on public.recurring_expenses for delete using (auth.uid() = user_id);

create or replace function public.record_recurring_expense(p_recurring_expense_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
    recurring public.recurring_expenses%rowtype;
    expense_id uuid;
begin
    select * into recurring
    from public.recurring_expenses
    where id = p_recurring_expense_id and user_id = auth.uid()
    for update;

    if not found then
        raise exception 'Recurring expense not found.';
    end if;
    if recurring.next_due_date > current_date then
        raise exception 'This recurring expense is not due yet.';
    end if;

    insert into public.expenses (user_id, description, amount, category, expense_date)
    values (recurring.user_id, recurring.description, recurring.amount, recurring.category, recurring.next_due_date)
    returning id into expense_id;

    update public.recurring_expenses
    set next_due_date = case recurring.frequency
        when 'weekly' then (recurring.next_due_date + interval '7 days')::date
        else (
            date_trunc('month', recurring.next_due_date::timestamp)
            + interval '1 month'
            + (least(
                recurring.due_day,
                extract(day from (
                    date_trunc('month', recurring.next_due_date::timestamp)
                    + interval '2 months'
                    - interval '1 day'
                ))::int
            ) - 1) * interval '1 day'
        )::date
    end
    where id = recurring.id;

    return expense_id;
end;
$$;

revoke all on function public.record_recurring_expense(uuid) from public;
grant execute on function public.record_recurring_expense(uuid) to authenticated;

create or replace function public.create_profile_for_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.create_profile_for_user();
