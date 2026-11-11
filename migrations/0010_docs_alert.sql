alter table containers add column if not exists broker text not null default '';
alter table containers add column if not exists dhl_address text not null default '';
alter table containers add column if not exists docs_requested boolean not null default false;
