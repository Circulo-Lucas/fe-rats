-- "sacramentos" continua na tabela para não quebrar check-ins antigos; o app não oferece mais.
insert into public.activity_types (id, label, points, emoji, sort_order) values
  ('confissao', 'Confissão', 15, '✝', 5),
  ('encontro_familia', 'Encontro da família', 5, '👪', 7),
  ('terco', 'Rezar o terço', 3, '📿', 8)
on conflict (id) do update
set label = excluded.label,
    points = excluded.points,
    emoji = excluded.emoji,
    sort_order = excluded.sort_order;
