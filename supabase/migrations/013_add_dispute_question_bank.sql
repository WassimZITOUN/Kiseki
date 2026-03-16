-- ============================================================
-- Kiseki – Add 6 divisive spicy questions
-- Migration 013
-- ============================================================

insert into public.question_bank (question, category, intensity, tag_id) values
  ('Qui trahirait le groupe en premier pour sauver sa reputation ?', 'general', 'epice',
    (select id from public.tags where name = 'rebelle')),
  ('Qui est le plus hypocrite quand il faut assumer ses choix ?', 'general', 'epice',
    (select id from public.tags where name = 'dramaqueen')),
  ('Qui manipule le plus les autres sans jamais le reconnaitre ?', 'general', 'epice',
    (select id from public.tags where name = 'mysterieux')),
  ('Qui est le plus toxique dans les conflits du groupe ?', 'general', 'epice',
    (select id from public.tags where name = 'tete-a-claque')),
  ('Qui retournerait sa veste des que ca l arrange ?', 'general', 'epice',
    (select id from public.tags where name = 'autre')),
  ('Qui serait capable de balancer un secret prive pour se proteger ?', 'general', 'epice',
    (select id from public.tags where name = 'bavard'))
on conflict (question) do nothing;
