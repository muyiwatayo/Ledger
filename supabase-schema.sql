create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    monthly_budget numeric(12, 2) not null default 250000,
    created_at timestamptz not null default now()
);

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

alter table public.profiles enable row level security;
alter table public.expenses enable row level security;

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
