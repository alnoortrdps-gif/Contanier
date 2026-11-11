alter table invoices add column if not exists supplier text not null default '';
alter table invoices add column if not exists importer text not null default '';
update invoices set supplier = client where supplier = '';
alter table invoices drop column client;
