-- Create enterprise_inquiries table
create table public.enterprise_inquiries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  email text not null,
  company_name text not null,
  message text,
  user_id uuid references auth.users(id),
  status text default 'pending' check (status in ('pending', 'contacted', 'closed')),
  contacted_at timestamp with time zone,
  notes text
);

-- Set up RLS (Row Level Security)
alter table public.enterprise_inquiries enable row level security;

-- Allow authenticated users to insert their own inquiries
create policy "Users can insert their own inquiries"
  on public.enterprise_inquiries for insert
  with check (auth.uid() = user_id or user_id is null);

-- Allow users to view their own inquiries
create policy "Users can view their own inquiries"
  on public.enterprise_inquiries for select
  using (auth.uid() = user_id);

-- Grant access to authenticated users
grant insert on public.enterprise_inquiries to authenticated;
grant select on public.enterprise_inquiries to authenticated; 