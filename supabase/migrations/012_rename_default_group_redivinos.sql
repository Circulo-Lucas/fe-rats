-- Grupo padrão passa a se chamar REDivinos. Membros, registros e pontos continuam iguais.
update public.communities
set name = 'REDivinos',
    invite_code = 'REDIVINOS'
where id = '00000000-0000-4000-8000-000000000010';
