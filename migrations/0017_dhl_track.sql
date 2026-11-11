alter table containers add column if not exists dhl_status text not null default '';
alter table containers add column if not exists dhl_date text not null default '';
alter table containers add column if not exists dhl_checked text not null default '';
