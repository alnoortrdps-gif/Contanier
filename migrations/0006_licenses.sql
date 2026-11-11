alter table invoices add column if not exists agri_license text not null default '';
alter table invoices add column if not exists agri_available boolean not null default false;
alter table invoices add column if not exists beitel_license text not null default '';
alter table invoices add column if not exists beitel_available boolean not null default false;
