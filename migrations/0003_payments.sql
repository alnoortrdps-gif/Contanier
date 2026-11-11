create table if not exists payments (
  id text primary key,
  user_id text not null,
  invoice_id text not null,
  amount double precision not null check (amount > 0),
  paid_on date not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists payments_user_id_idx on payments (user_id);
create index if not exists payments_invoice_id_idx on payments (invoice_id);
