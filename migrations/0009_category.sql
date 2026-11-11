alter table invoices add column if not exists category text not null default 'meat';
alter table containers add column if not exists category text not null default 'meat';
