-- Nova tabela de pontos. O ranking soma activity_types.points, então registros antigos
-- passam a valer os pontos novos.
insert into public.activity_types (id, label, points, emoji, sort_order) values
  ('circulo', 'Círculo', 20, '⭕', 1),
  ('missa_dominical', 'Missa dominical', 20, '⛪', 2),
  ('confissao', 'Confissão (2x ao ano: antes da Quaresma / antes de servir no EJC)', 15, '✝', 3),
  ('adoracao', 'Adoração / visita ao Santíssimo', 10, '🕯', 4),
  ('terco', 'Terço com REDivinos (2x por mês, cada encontro)', 10, '📿', 5),
  ('missa_semana', 'Missa em meio de semana', 5, '⛪', 6),
  ('eventos_sgm', 'Eventos (formações / ações)', 5, '🤝', 7),
  ('encontro_familia', 'Encontro de família', 5, '👪', 8)
on conflict (id) do update
set label = excluded.label,
    points = excluded.points,
    emoji = excluded.emoji,
    sort_order = excluded.sort_order;
