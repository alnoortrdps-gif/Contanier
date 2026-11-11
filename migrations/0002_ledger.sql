create table if not exists invoices (
  id text primary key,
  user_id text not null,
  number text not null,
  client text not null,
  amount double precision not null,
  currency text not null,
  due date not null,
  status text not null check (status in ('pending', 'paid')),
  note text not null default '',
  container_number text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists invoices_user_id_idx on invoices (user_id);

create table if not exists containers (
  id text primary key,
  user_id text not null,
  number text not null,
  type text not null,
  port text not null default '',
  status text not null check (status in ('transit', 'arrived', 'delivered', 'hold')),
  eta date,
  invoice_number text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists containers_user_id_idx on containers (user_id);
