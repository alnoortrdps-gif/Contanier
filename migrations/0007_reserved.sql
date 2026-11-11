alter table containers drop constraint if exists containers_status_check;
alter table containers add constraint containers_status_check
  check (status in ('transit', 'arrived', 'delivered', 'hold', 'reserved'));
