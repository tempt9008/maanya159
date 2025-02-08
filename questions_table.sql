-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create questions table
create table questions (
    id uuid default uuid_generate_v4() primary key,
    category_id uuid not null references categories(id) on delete cascade,
    type text not null check (type in ('text', 'truefalse', 'multichoice', 'image')),
    question text not null,
    correct_answer text not null,
    options text[] default null,
    image_url text default null,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Add indexes for better query performance
    constraint questions_category_id_index foreign key (category_id) references categories(id)
);

-- Add row level security policies
alter table questions enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Anyone can read questions" on questions;
drop policy if exists "Anyone can insert questions" on questions;
drop policy if exists "Anyone can update questions" on questions;
drop policy if exists "Anyone can delete questions" on questions;

-- Create policy for anyone to read questions (both active and inactive)
create policy "Anyone can read questions"
    on questions for select
    using (true);

-- Create policy for anyone to insert questions
create policy "Anyone can insert questions"
    on questions for insert
    with check (true);

-- Create policy for anyone to update questions
create policy "Anyone can update questions"
    on questions for update
    using (true);

-- Create explicit policy for deleting questions
create policy "Anyone can delete questions"
    on questions for delete
    using (true);

-- Create indexes for better performance
create index questions_category_id_idx on questions(category_id);
create index questions_type_idx on questions(type);
create index questions_created_at_idx on questions(created_at);