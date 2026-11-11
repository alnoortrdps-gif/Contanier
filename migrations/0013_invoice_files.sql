create table if not exists invoice_files (
  id text primary key,
  invoice_id text not null,
  kind text not null,
  filename text not null default '',
  data text not null default '',
  unique (invoice_id, kind)
);
