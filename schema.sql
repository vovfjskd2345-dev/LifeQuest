-- =====================================================================
-- LifeQuest — Supabase schema (Postgres + RLS)
-- Run this whole file once in: Supabase Dashboard -> SQL Editor -> New query
--
-- Security model:
--   * Clients can only SELECT from tables (RLS-restricted).
--   * ALL writes (XP, Coins, quests, purchases, friends) go through
--     SECURITY DEFINER functions that validate everything server-side.
--   * Nobody can edit another user's XP/Coins; nobody can edit their own
--     XP/Coins directly either.
-- =====================================================================

-- ---------- Core tables ----------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  character_name text not null check (char_length(character_name) between 2 and 24),
  gender text not null check (gender in ('male','female')),
  appearance int not null default 0 check (appearance between 0 and 5),
  bio text not null default '' check (char_length(bio) <= 160),
  active_companion text not null,
  theme text not null default 'theme_neon',
  background text,
  title text not null default 'title_novice',
  level int not null default 1,
  xp int not null default 0,                       -- XP inside the current level
  coins int not null default 0 check (coins >= 0),
  total_xp int not null default 0,
  total_coins int not null default 0,
  quests_completed int not null default 0,
  streak int not null default 0,
  best_streak int not null default 0,
  last_active date,
  tz_offset_min int not null default 0 check (tz_offset_min between -840 and 840),
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower on public.profiles (lower(username));

create table if not exists public.shop_items (
  id text primary key,
  category text not null check (category in ('companion','cosmetic','theme','background','title','other')),
  name text not null,
  description text not null,
  price int not null check (price >= 0),
  min_level int not null default 1,
  data jsonb not null default '{}'::jsonb,
  sort int not null default 0
);

-- Passive companion bonuses (applied server-side to the ACTIVE companion's owner when a quest is completed).
-- topics = '' means every category, otherwise a comma list such as 'Work,Study'.
create table if not exists public.pet_perks (
  item_id text primary key references public.shop_items(id),
  xp_pct int not null default 0 check (xp_pct between 0 and 50),
  coin_pct int not null default 0 check (coin_pct between 0 and 50),
  topics text not null default ''
);

create table if not exists public.inventory (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id text not null references public.shop_items(id),
  equipped boolean not null default false,
  acquired_at timestamptz not null default now(),
  primary key (user_id, item_id)                   -- => no duplicate purchases
);

create table if not exists public.quest_templates (
  id text primary key,
  kind text not null check (kind in ('daily','weekly','special')),
  topic text not null check (topic in ('Health','Mind','Study','Work','Home','Social','Creative')),
  name text not null,
  description text not null,
  difficulty text not null check (difficulty in ('easy','medium','hard','epic')),
  requires_proof boolean not null default false
);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_id text references public.quest_templates(id),
  kind text not null check (kind in ('daily','weekly','special')),
  topic text not null check (topic in ('Health','Mind','Study','Work','Home','Social','Creative')),
  name text not null check (char_length(name) between 3 and 60),
  description text not null default '' check (char_length(description) <= 300),
  difficulty text not null check (difficulty in ('easy','medium','hard','epic')),
  xp_reward int not null,
  coin_reward int not null,
  requires_proof boolean not null default false,
  is_custom boolean not null default false,
  deadline timestamptz,
  period_key text not null,
  period_date date,
  status text not null default 'available'
    check (status in ('available','in_progress','pending_review','completed')),
  evidence_note text,
  evidence_path text,
  review_note text,
  reviewed_by uuid references public.profiles(id),
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, template_id, period_key)        -- => one instance per template/period
);
create index if not exists quests_user_idx on public.quests (user_id, status);

create table if not exists public.achievements (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  metric text not null check (metric in ('quests','level','streak','special','companions','friends','coins')),
  target int not null,
  reward_coins int not null default 0,
  sort int not null default 0
);

create table if not exists public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id text not null references public.achievements(id),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null references public.profiles(id) on delete cascade,
  addressee uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  check (requester <> addressee)
);
create unique index if not exists friendships_pair on public.friendships
  (least(requester, addressee), greatest(requester, addressee));

create table if not exists public.cheers (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('fire','muscle','star','clap')),
  cheer_date date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  unique (from_id, to_id, cheer_date),
  check (from_id <> to_id)
);

-- ---------- Helper functions -----------------------------------------

create or replace function public.xp_needed(lvl int) returns int
language sql immutable as $$
  select 100 + 40*(lvl-1) + 10*(lvl-1)*(lvl-1)
$$;

create or replace function public.reward_for(k text, d text, custom boolean)
returns table(xp int, coins int) language sql immutable as $$
  select
    greatest(1, floor((case d when 'easy' then 10 when 'medium' then 25 when 'hard' then 50 else 100 end)
      * (case k when 'daily' then 1.0 when 'weekly' then 2.0 else 3.0 end)
      * (case when custom then 0.5 else 1.0 end))::int),
    greatest(1, floor((case d when 'easy' then 5 when 'medium' then 12 when 'hard' then 25 else 50 end)
      * (case k when 'daily' then 1.0 when 'weekly' then 2.0 else 3.0 end)
      * (case when custom then 0.5 else 1.0 end))::int)
$$;

create or replace function public.local_today(uid uuid) returns date
language sql stable security definer set search_path = public as $$
  select ((now() at time zone 'utc') + make_interval(mins => tz_offset_min))::date
  from public.profiles where id = uid
$$;

create or replace function public.week_start(d date) returns date
language sql immutable as $$
  select d - (extract(isodow from d)::int - 1)
$$;

create or replace function public.is_friend(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester = a and f.addressee = b) or (f.requester = b and f.addressee = a))
  )
$$;

-- ---------- New-user trigger (profile created from signup metadata) ---

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  pet text := coalesce(m->>'companion', 'pet_gloop');
  uname text := m->>'username';
  inviter uuid;
begin
  if pet not in ('pet_gloop','pet_ember','pet_bit') then pet := 'pet_gloop'; end if;

  insert into public.profiles (id, username, character_name, gender, appearance, active_companion)
  values (
    new.id, uname,
    left(coalesce(nullif(trim(m->>'character_name'), ''), uname), 24),
    case when m->>'gender' = 'female' then 'female' else 'male' end,
    least(greatest(coalesce((m->>'appearance')::int, 0), 0), 5),
    pet
  );

  insert into public.inventory (user_id, item_id, equipped) values
    (new.id, pet, true), (new.id, 'theme_neon', true), (new.id, 'title_novice', true);

  -- Invite code from a friend's link: instantly become friends
  if coalesce(m->>'invite_code','') <> '' then
    select id into inviter from public.profiles where invite_code = upper(m->>'invite_code');
    if inviter is not null then
      insert into public.friendships (requester, addressee, status) values (inviter, new.id, 'accepted');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.username_available(uname text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(uname))
$$;

-- ---------- Achievements ----------------------------------------------

create or replace function public.check_achievements(uid uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  p public.profiles; a public.achievements; val int; got jsonb := '[]'::jsonb; ins int;
begin
  select * into p from public.profiles where id = uid;
  for a in select * from public.achievements
           where id not in (select achievement_id from public.user_achievements where user_id = uid)
           order by sort loop
    val := case a.metric
      when 'quests' then p.quests_completed
      when 'level' then p.level
      when 'streak' then p.best_streak
      when 'coins' then p.total_coins
      when 'special' then (select count(*) from public.quests q where q.user_id = uid and q.kind = 'special' and q.status = 'completed')
      when 'companions' then (select count(*) from public.inventory i join public.shop_items s on s.id = i.item_id
                              where i.user_id = uid and s.category = 'companion')
      when 'friends' then (select count(*) from public.friendships f
                           where f.status = 'accepted' and (f.requester = uid or f.addressee = uid))
    end;
    if val >= a.target then
      insert into public.user_achievements (user_id, achievement_id) values (uid, a.id)
      on conflict do nothing;
      get diagnostics ins = row_count;
      if ins = 1 then
        if a.reward_coins > 0 then
          update public.profiles set coins = coins + a.reward_coins, total_coins = total_coins + a.reward_coins
          where id = uid;
        end if;
        got := got || jsonb_build_object('id', a.id, 'name', a.name, 'icon', a.icon, 'reward_coins', a.reward_coins);
      end if;
    end if;
  end loop;
  return got;
end $$;

-- ---------- Quest engine ----------------------------------------------

create or replace function public.ensure_period_quests() returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); today date; wk date; tz int;
begin
  if uid is null then raise exception 'Not signed in'; end if;
  today := public.local_today(uid);
  wk := public.week_start(today);
  select tz_offset_min into tz from public.profiles where id = uid;

  -- Daily and weekly templates: one instance per template per period.
  insert into public.quests (user_id, template_id, kind, topic, name, description, difficulty,
                             xp_reward, coin_reward, requires_proof, period_key, period_date)
  select uid, t.id, t.kind, t.topic, t.name, t.description, t.difficulty, r.xp, r.coins, t.requires_proof,
         case t.kind when 'daily' then today::text else wk::text end,
         case t.kind when 'daily' then today else wk end
  from public.quest_templates t
  cross join lateral public.reward_for(t.kind, t.difficulty, false) r
  where t.kind in ('daily','weekly')
  on conflict (user_id, template_id, period_key) do nothing;

  -- Special quests rotate weekly: 3 challenges per player per week, picked from the pool in a
  -- week-dependent order. Picked once per week, so adding templates later never adds extras.
  -- They expire at the player's local Monday 00:00.
  if not exists (select 1 from public.quests
                 where user_id = uid and kind = 'special' and not is_custom and period_key = wk::text) then
    insert into public.quests (user_id, template_id, kind, topic, name, description, difficulty,
                               xp_reward, coin_reward, requires_proof, period_key, period_date, deadline)
    select uid, t.id, 'special', t.topic, t.name, t.description, t.difficulty, r.xp, r.coins, t.requires_proof,
           wk::text, wk, (((wk + 7)::timestamp - make_interval(mins => tz)) at time zone 'UTC')
    from (select * from public.quest_templates
          where kind = 'special'
            and id not in (select template_id from public.quests    -- never repeat last week's picks
                           where user_id = uid and kind = 'special' and not is_custom and period_key = (wk - 7)::text)
          order by md5(wk::text || uid::text || id) limit 3) t
    cross join lateral public.reward_for('special', t.difficulty, false) r
    on conflict (user_id, template_id, period_key) do nothing;
  end if;
  -- keep the expiry at the player's CURRENT local Monday 00:00 (follows travel / time-zone changes)
  update public.quests set deadline = (((wk + 7)::timestamp - make_interval(mins => tz)) at time zone 'UTC')
  where user_id = uid and kind = 'special' and not is_custom and period_key = wk::text and status <> 'completed';
end $$;

create or replace function public.create_custom_quest(
  p_name text, p_desc text, p_kind text, p_topic text, p_diff text,
  p_proof boolean, p_deadline timestamptz
) returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); today date; r record; recent int; newid uuid; proof boolean := p_proof;
begin
  if uid is null then raise exception 'Not signed in'; end if;
  if p_kind not in ('daily','weekly','special') then raise exception 'Invalid quest type'; end if;
  if p_diff not in ('easy','medium','hard','epic') then raise exception 'Invalid difficulty'; end if;
  if p_diff = 'epic' and p_kind <> 'special' then raise exception 'Epic difficulty is only for Special quests'; end if;
  if p_topic not in ('Health','Mind','Study','Work','Home','Social','Creative') then raise exception 'Invalid category'; end if;
  if char_length(trim(coalesce(p_name,''))) < 3 then raise exception 'Name must be at least 3 characters'; end if;
  if p_deadline is not null and (p_deadline <= now() or p_deadline > now() + interval '366 days') then
    raise exception 'Deadline must be in the future (max 1 year)';
  end if;

  -- anti-farming: limited custom quests per window, reduced rewards
  if p_kind = 'special' then
    proof := true;   -- custom special quests always need a friend's approval
    select count(*) into recent from public.quests
      where user_id = uid and is_custom and kind = 'special' and created_at > now() - interval '7 days';
    if recent >= 3 then raise exception 'Limit reached: 3 custom Special quests per week'; end if;
  else
    select count(*) into recent from public.quests
      where user_id = uid and is_custom and kind <> 'special' and created_at > now() - interval '24 hours';
    if recent >= 5 then raise exception 'Limit reached: 5 custom quests per day'; end if;
  end if;

  today := public.local_today(uid);
  select * into r from public.reward_for(p_kind, p_diff, true);
  insert into public.quests (user_id, kind, topic, name, description, difficulty, xp_reward, coin_reward,
                             requires_proof, is_custom, deadline, period_key, period_date)
  values (uid, p_kind, p_topic, trim(p_name), left(coalesce(p_desc,''), 300), p_diff, r.xp, r.coins,
          proof, true, case when p_kind = 'special' then p_deadline else null end,
          'c-' || gen_random_uuid()::text,
          case p_kind when 'daily' then today when 'weekly' then public.week_start(today) else null end)
  returning id into newid;
  return newid;
end $$;

create or replace function public.delete_custom_quest(qid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.quests where id = qid and user_id = auth.uid() and is_custom and status <> 'completed';
end $$;

create or replace function public.start_quest(qid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.quests set status = 'in_progress'
  where id = qid and user_id = auth.uid() and status = 'available';
end $$;

-- Internal: pays out rewards exactly once.
create or replace function public.finish_quest(qid uuid, reviewer uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  q public.quests%rowtype; p public.profiles%rowtype; perk public.pet_perks%rowtype;
  today date; lv_before int; new_streak int; need int; ach jsonb;
  bxp int := 0; bcoins int := 0; gxp int; gcoins int;
begin
  update public.quests set status = 'completed', completed_at = now(), reviewed_by = reviewer
  where id = qid and status in ('available','in_progress','pending_review')
  returning * into q;
  if q.id is null then raise exception 'This quest was already completed'; end if;

  select * into p from public.profiles where id = q.user_id for update;
  today := public.local_today(q.user_id);
  lv_before := p.level;

  -- last_active >= today also covers travelling west, where the local date goes backwards
  if p.last_active >= today then new_streak := greatest(p.streak, 1);
  elsif p.last_active = today - 1 then new_streak := p.streak + 1;
  else new_streak := 1; end if;

  -- companion perk: bonus % on the base reward (at least +1 when the perk applies)
  select * into perk from public.pet_perks where item_id = p.active_companion;
  if found and (perk.topics = '' or q.topic = any (string_to_array(perk.topics, ','))) then
    if perk.xp_pct > 0 then bxp := greatest(1, round(q.xp_reward * perk.xp_pct / 100.0)::int); end if;
    if perk.coin_pct > 0 then bcoins := greatest(1, round(q.coin_reward * perk.coin_pct / 100.0)::int); end if;
  end if;
  gxp := q.xp_reward + bxp; gcoins := q.coin_reward + bcoins;

  p.xp := p.xp + gxp;
  loop
    need := public.xp_needed(p.level);
    exit when p.xp < need;
    p.xp := p.xp - need;
    p.level := p.level + 1;
  end loop;

  update public.profiles set
    level = p.level, xp = p.xp,
    coins = coins + gcoins,
    total_xp = total_xp + gxp,
    total_coins = total_coins + gcoins,
    quests_completed = quests_completed + 1,
    streak = new_streak, best_streak = greatest(best_streak, new_streak),
    last_active = greatest(coalesce(last_active, today), today)
  where id = p.id;

  ach := public.check_achievements(q.user_id);
  return jsonb_build_object(
    'quest_id', q.id, 'xp', gxp, 'coins', gcoins, 'bonus_xp', bxp, 'bonus_coins', bcoins,
    'level_before', lv_before, 'level_after', p.level, 'leveled_up', p.level > lv_before,
    'achievements', ach
  );
end $$;

create or replace function public.complete_quest(qid uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare q public.quests%rowtype;
begin
  select * into q from public.quests where id = qid and user_id = auth.uid();
  if q.id is null then raise exception 'Quest not found'; end if;
  if q.requires_proof then raise exception 'This quest needs evidence — submit it for review'; end if;
  if q.deadline is not null and q.deadline < now() then raise exception 'This quest has expired'; end if;
  return public.finish_quest(qid, null);
end $$;

create or replace function public.submit_quest(qid uuid, note text, path text) returns void
language plpgsql security definer set search_path = public as $$
declare q public.quests%rowtype; has_note boolean := char_length(trim(coalesce(note,''))) >= 3;
begin
  select * into q from public.quests where id = qid and user_id = auth.uid();
  if q.id is null then raise exception 'Quest not found'; end if;
  if not q.requires_proof then raise exception 'This quest does not need review'; end if;
  if q.status not in ('available','in_progress') then raise exception 'Quest cannot be submitted right now'; end if;
  if q.deadline is not null and q.deadline < now() then raise exception 'This quest has expired'; end if;
  if path is not null and path not like auth.uid()::text || '/%' then raise exception 'Invalid file path'; end if;
  if not has_note and path is null then raise exception 'Add a short explanation or a file as evidence'; end if;
  update public.quests set status = 'pending_review', evidence_note = left(trim(coalesce(note,'')), 500),
    evidence_path = path, submitted_at = now(), review_note = null
  where id = qid;
end $$;

-- A friend (never the owner) approves or rejects evidence.
create or replace function public.review_quest(qid uuid, approve boolean, note text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare q public.quests%rowtype; me uuid := auth.uid();
begin
  select * into q from public.quests where id = qid;
  if q.id is null or q.status <> 'pending_review' then raise exception 'Nothing to review'; end if;
  if q.user_id = me then raise exception 'You cannot review your own quest'; end if;
  if not public.is_friend(me, q.user_id) then raise exception 'Only friends can review this quest'; end if;
  if approve then
    return public.finish_quest(qid, me);
  end if;
  update public.quests set status = 'in_progress', review_note = left(coalesce(note,'Rejected'), 200), reviewed_by = me
  where id = qid;
  return jsonb_build_object('rejected', true);
end $$;

-- ---------- Shop --------------------------------------------------------

create or replace function public.purchase_item(iid text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare it public.shop_items%rowtype; p public.profiles%rowtype; ach jsonb; uid uuid := auth.uid();
begin
  select * into it from public.shop_items where id = iid;
  if it.id is null then raise exception 'Item not found'; end if;
  select * into p from public.profiles where id = uid for update;     -- serialises purchases
  if exists (select 1 from public.inventory where user_id = uid and item_id = iid) then
    raise exception 'You already own this item';
  end if;
  if p.level < it.min_level then raise exception 'Requires level %', it.min_level; end if;
  if p.coins < it.price then raise exception 'Not enough Coins'; end if;
  update public.profiles set coins = coins - it.price where id = uid;
  insert into public.inventory (user_id, item_id) values (uid, iid);
  ach := public.check_achievements(uid);
  return jsonb_build_object('item', it.id, 'coins_after', p.coins - it.price, 'achievements', ach);
end $$;

create or replace function public.equip_item(iid text, on_off boolean) returns void
language plpgsql security definer set search_path = public as $$
declare it public.shop_items%rowtype; uid uuid := auth.uid(); slot text;
begin
  select * into it from public.shop_items where id = iid;
  if it.id is null or not exists (select 1 from public.inventory where user_id = uid and item_id = iid) then
    raise exception 'You do not own this item';
  end if;

  if it.category = 'companion' then
    if not on_off then raise exception 'Choose another companion to switch'; end if;
    update public.inventory i set equipped = (i.item_id = iid)
      from public.shop_items s where i.user_id = uid and s.id = i.item_id and s.category = 'companion';
    update public.profiles set active_companion = iid where id = uid;

  elsif it.category in ('theme','title','background') then
    update public.inventory i set equipped = false
      from public.shop_items s where i.user_id = uid and s.id = i.item_id and s.category = it.category;
    if on_off then
      update public.inventory set equipped = true where user_id = uid and item_id = iid;
    elsif it.category = 'theme' then
      update public.inventory set equipped = true where user_id = uid and item_id = 'theme_neon';
    elsif it.category = 'title' then
      update public.inventory set equipped = true where user_id = uid and item_id = 'title_novice';
    end if;
    if it.category = 'theme' then
      update public.profiles set theme = case when on_off then iid else 'theme_neon' end where id = uid;
    elsif it.category = 'title' then
      update public.profiles set title = case when on_off then iid else 'title_novice' end where id = uid;
    else
      update public.profiles set background = case when on_off then iid else null end where id = uid;
    end if;

  else  -- cosmetic / other: exclusive per slot, individually toggleable
    slot := it.data->>'slot';
    if on_off and slot is not null then
      update public.inventory i set equipped = false
        from public.shop_items s
        where i.user_id = uid and s.id = i.item_id and s.category = it.category and s.data->>'slot' = slot;
    end if;
    update public.inventory set equipped = on_off where user_id = uid and item_id = iid;
  end if;
end $$;

-- ---------- Profile -----------------------------------------------------

create or replace function public.update_profile(p_char text, p_appearance int, p_bio text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if char_length(trim(coalesce(p_char,''))) < 2 then raise exception 'Character name too short'; end if;
  if p_appearance not between 0 and 5 then raise exception 'Invalid appearance'; end if;
  update public.profiles set character_name = left(trim(p_char), 24), appearance = p_appearance,
    bio = left(coalesce(p_bio,''), 160) where id = auth.uid();
end $$;

create or replace function public.my_profile() returns public.profiles
language sql stable security definer set search_path = public as $$
  select * from public.profiles where id = auth.uid()
$$;

create or replace function public.set_tz(mins int) returns void
language sql security definer set search_path = public as $$
  update public.profiles set tz_offset_min = greatest(-840, least(840, mins)) where id = auth.uid()
$$;

-- ---------- Friends -----------------------------------------------------

create or replace function public.send_friend_request(uname text) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); target uuid; f public.friendships%rowtype;
begin
  select id into target from public.profiles where lower(username) = lower(trim(uname));
  if target is null then raise exception 'No player with that username'; end if;
  if target = me then raise exception 'You cannot add yourself'; end if;
  select * into f from public.friendships
    where (requester = me and addressee = target) or (requester = target and addressee = me);
  if f.id is not null then
    if f.status = 'accepted' then raise exception 'Already friends'; end if;
    if f.requester = me then raise exception 'Request already sent'; end if;
    update public.friendships set status = 'accepted' where id = f.id;   -- they had asked us first
    perform public.check_achievements(me); perform public.check_achievements(target);
    return 'accepted';
  end if;
  insert into public.friendships (requester, addressee) values (me, target);
  return 'sent';
end $$;

create or replace function public.respond_friend_request(fid uuid, accept boolean) returns void
language plpgsql security definer set search_path = public as $$
declare f public.friendships%rowtype;
begin
  select * into f from public.friendships where id = fid and addressee = auth.uid() and status = 'pending';
  if f.id is null then raise exception 'Request not found'; end if;
  if accept then
    update public.friendships set status = 'accepted' where id = fid;
    perform public.check_achievements(f.requester); perform public.check_achievements(f.addressee);
  else
    delete from public.friendships where id = fid;
  end if;
end $$;

create or replace function public.remove_friend(fid uuid) returns void
language sql security definer set search_path = public as $$
  delete from public.friendships where id = fid and (requester = auth.uid() or addressee = auth.uid())
$$;

create or replace function public.add_friend_by_code(code text) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); target uuid;
begin
  select id into target from public.profiles where invite_code = upper(trim(code));
  if target is null then raise exception 'Invalid invite code'; end if;
  if target = me then raise exception 'That is your own code'; end if;
  insert into public.friendships (requester, addressee, status) values (target, me, 'accepted')
    on conflict do nothing;
  update public.friendships set status = 'accepted'
    where (requester = me and addressee = target) or (requester = target and addressee = me);
  perform public.check_achievements(me); perform public.check_achievements(target);
  return (select username from public.profiles where id = target);
end $$;

create or replace function public.send_cheer(to_user uuid, k text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_friend(auth.uid(), to_user) then raise exception 'You can only cheer friends'; end if;
  insert into public.cheers (from_id, to_id, kind, cheer_date)
  values (auth.uid(), to_user, k, (now() at time zone 'utc')::date);
exception when unique_violation then
  raise exception 'You already cheered this friend today';
end $$;

-- ---------- Row Level Security ----------------------------------------

alter table public.profiles enable row level security;
alter table public.shop_items enable row level security;
alter table public.inventory enable row level security;
alter table public.pet_perks enable row level security;
alter table public.quest_templates enable row level security;
alter table public.quests enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.friendships enable row level security;
alter table public.cheers enable row level security;

drop policy if exists p_profiles_read on public.profiles;
create policy p_profiles_read on public.profiles for select to authenticated using (true);

drop policy if exists p_shop_read on public.shop_items;
create policy p_shop_read on public.shop_items for select to authenticated using (true);
drop policy if exists p_perks_read on public.pet_perks;
create policy p_perks_read on public.pet_perks for select to authenticated using (true);
drop policy if exists p_tpl_read on public.quest_templates;
create policy p_tpl_read on public.quest_templates for select to authenticated using (true);
drop policy if exists p_ach_read on public.achievements;
create policy p_ach_read on public.achievements for select to authenticated using (true);

drop policy if exists p_inv_read on public.inventory;
create policy p_inv_read on public.inventory for select to authenticated
  using (user_id = auth.uid() or public.is_friend(auth.uid(), user_id));

drop policy if exists p_quests_read on public.quests;
create policy p_quests_read on public.quests for select to authenticated
  using (user_id = auth.uid() or (status = 'pending_review' and public.is_friend(auth.uid(), user_id)));

drop policy if exists p_uach_read on public.user_achievements;
create policy p_uach_read on public.user_achievements for select to authenticated
  using (user_id = auth.uid() or public.is_friend(auth.uid(), user_id));

drop policy if exists p_fr_read on public.friendships;
create policy p_fr_read on public.friendships for select to authenticated
  using (requester = auth.uid() or addressee = auth.uid());

drop policy if exists p_cheers_read on public.cheers;
create policy p_cheers_read on public.cheers for select to authenticated
  using (from_id = auth.uid() or to_id = auth.uid());

-- No direct writes from clients at all; everything goes through the functions above.
revoke all on all tables in schema public from anon, authenticated;
grant select on all tables in schema public to authenticated;
-- Private columns (invite code, coin balance, time-zone offset) are hidden from other players:
-- clients read their own full row through my_profile() instead.
revoke select on public.profiles from authenticated;
grant select (id, username, character_name, gender, appearance, bio, active_companion, theme, background, title,
  level, xp, total_xp, total_coins, quests_completed, streak, best_streak, last_active, created_at)
  on public.profiles to authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function
  public.username_available(text) to anon, authenticated;
grant execute on function
  public.xp_needed(int), public.week_start(date), public.is_friend(uuid, uuid),
  public.ensure_period_quests(), public.create_custom_quest(text,text,text,text,text,boolean,timestamptz),
  public.delete_custom_quest(uuid), public.start_quest(uuid), public.complete_quest(uuid),
  public.submit_quest(uuid,text,text), public.review_quest(uuid,boolean,text),
  public.purchase_item(text), public.equip_item(text,boolean),
  public.update_profile(text,int,text), public.set_tz(int), public.my_profile(),
  public.send_friend_request(text), public.respond_friend_request(uuid,boolean),
  public.remove_friend(uuid), public.add_friend_by_code(text), public.send_cheer(uuid,text)
  to authenticated;

-- ---------- Storage (quest evidence, private bucket) -------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 10485760,
  array['image/png','image/jpeg','image/webp','image/gif','application/pdf','text/plain'])
on conflict (id) do nothing;

drop policy if exists evidence_insert on storage.objects;
create policy evidence_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists evidence_delete on storage.objects;
create policy evidence_delete on storage.objects for delete to authenticated
  using (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists evidence_select on storage.objects;
create policy evidence_select on storage.objects for select to authenticated
  using (bucket_id = 'evidence' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_friend(auth.uid(), ((storage.foldername(name))[1])::uuid)));

-- ---------- Seed data ---------------------------------------------------

insert into public.shop_items (id, category, name, description, price, min_level, data, sort) values
 -- companions
 ('pet_gloop','companion','Gloop the Slime','A bouncy cyan slime. Squishes happily when you win.',150,1,'{}',1),
 ('pet_ember','companion','Ember the Fox','A clever little fox with a flickering tail.',150,1,'{}',2),
 ('pet_bit','companion','Bit the Bot','A tiny robot who beeps with every victory.',150,1,'{}',3),
 ('pet_mochi','companion','Mochi the Bunny','Soft, shy and always ready to hop.',300,3,'{}',4),
 ('pet_nox','companion','Nox the Owl','A wise night owl who swivels to watch your progress.',500,6,'{}',5),
 ('pet_drako','companion','Drako the Dragonling','A baby dragon. Breathes sparks when you level up.',900,10,'{}',6),
 -- cosmetics
 ('cos_wizard','cosmetic','Wizard Hat','A starry hat for the arcane adventurer.',120,1,'{"slot":"hat"}',10),
 ('cos_crown','cosmetic','Golden Crown','Only for heroes who have proven themselves.',300,5,'{"slot":"hat"}',11),
 ('cos_visor','cosmetic','Neon Visor','A cyber visor that glows across your eyes.',180,2,'{"slot":"face"}',12),
 ('cos_cape','cosmetic','Royal Cape','A flowing crimson cape.',250,3,'{"slot":"cape"}',13),
 ('cos_aura_cyan','cosmetic','Cyan Aura','A calm, glowing aura.',200,2,'{"slot":"aura"}',14),
 ('cos_aura_flame','cosmetic','Flame Aura','A burning violet-orange aura.',400,6,'{"slot":"aura"}',15),
 -- themes
 ('theme_neon','theme','Neon Grid','The default sci-fi look: navy, cyan and violet.',0,1,'{}',20),
 ('theme_aurora','theme','Aurora Peak','Snowy peaks under a green and violet aurora.',400,3,'{}',21),
 ('theme_forge','theme','Ember Forge','A volcanic forge with drifting embers.',500,4,'{}',22),
 ('theme_ocean','theme','Abyssal Reef','Deep ocean light, bubbles and coral.',450,4,'{}',23),
 ('theme_void','theme','Void Station','A derelict space station among the stars.',800,8,'{}',24),
 -- backgrounds
 ('bg_meadow','background','Moonlit Meadow','Rolling hills, fireflies and a big moon.',150,1,'{}',30),
 ('bg_cave','background','Crystal Cave','Glowing crystals in a quiet cavern.',250,3,'{}',31),
 ('bg_space','background','Orbit Deck','Stars, planets and a distant nebula.',300,5,'{}',32),
 ('bg_castle','background','Sky Castle','Towers floating above the clouds.',450,7,'{}',33),
 -- titles
 ('title_novice','title','Novice Adventurer','Everyone starts somewhere.',0,1,'{}',40),
 ('title_early','title','Early Bird','For those who win the morning.',100,1,'{}',41),
 ('title_scholar','title','Scholar','Knowledge is the best loot.',150,2,'{}',42),
 ('title_ironwill','title','Iron Will','Unbreakable discipline.',250,4,'{}',43),
 ('title_legend','title','Living Legend','Songs will be sung of you.',600,10,'{}',44),
 -- other
 ('fx_stars','other','Starlight Trail','Level-up bursts use golden stars.',200,2,'{"slot":"fx","fx":"stars"}',50),
 ('fx_hearts','other','Heart Burst','Level-up bursts use floating hearts.',200,2,'{"slot":"fx","fx":"hearts"}',51)
on conflict (id) do nothing;

insert into public.pet_perks (item_id, xp_pct, coin_pct, topics) values
 ('pet_gloop', 0, 10, ''),
 ('pet_ember', 10, 0, ''),
 ('pet_bit', 20, 0, 'Work,Study'),
 ('pet_mochi', 0, 20, 'Health,Home'),
 ('pet_nox', 20, 0, 'Mind,Creative'),
 ('pet_drako', 15, 15, '')
on conflict (item_id) do nothing;

insert into public.quest_templates (id, kind, topic, name, description, difficulty, requires_proof) values
 ('d_water','daily','Health','Hydration Potion','Drink at least 2 litres of water today.','easy',false),
 ('d_workout','daily','Health','Training Ground','Complete a 20-minute workout.','medium',true),
 ('d_read','daily','Mind','Scroll of Wisdom','Read for 15 minutes.','easy',false),
 ('d_tidy','daily','Home','Clear the Lair','Tidy your space for 10 minutes.','easy',false),
 ('d_focus','daily','Work','Deep Focus Ritual','One 45-minute distraction-free work session.','medium',false),
 ('d_study','daily','Study','Arcane Study','Study or practise a skill for 30 minutes.','medium',false),
 ('d_cook','daily','Health','Campfire Cooking','Cook a healthy meal.','medium',true),
 ('d_friend','daily','Social','Send a Raven','Message a friend or family member.','easy',false),
 ('d_create','daily','Creative','Spark of Creation','Draw, write or play music for 15 minutes.','easy',false),
 ('w_run','weekly','Health','Long Road','Walk or run 10 km in total this week.','hard',true),
 ('w_read','weekly','Mind','Tome Hunter','Read 100 pages this week.','hard',false),
 ('w_clean','weekly','Home','Dungeon Cleanse','Deep clean one room.','medium',true),
 ('w_skill','weekly','Study','Skill Tree','Spend 3 hours learning something new.','hard',false),
 ('w_meet','weekly','Social','Guild Meeting','Meet someone in person.','medium',false),
 ('s_project','special','Work','Boss Raid: Milestone','Finish a meaningful milestone of a personal project.','epic',true),
 ('s_adventure','special','Creative','Side Quest: Try Something New','Do something you have never done before.','hard',true),
 ('s_detox','special','Mind','Digital Detox','Spend 4 hours without your phone.','hard',true),
 ('s_5k','special','Health','The 5K Trial','Run or walk a full 5 km in one go.','epic',true),
 ('s_recipe','special','Creative','Master Chef','Cook a recipe you have never made before.','hard',true),
 ('s_declutter','special','Home','Great Purge','Declutter a closet, drawer or shelf and give things away.','hard',true),
 ('s_lesson','special','Study','Chapter Boss','Finish a full lesson, chapter or course module.','hard',true),
 ('s_meetup','special','Social','Reunion','Meet someone you have not seen in over a month.','hard',true),
 ('s_nature','special','Health','Wild Expedition','Spend an hour walking outdoors in nature.','medium',true),
 ('s_journal','special','Mind','Memory Scroll','Write a full-page reflection about your week.','medium',true),
 ('s_budget','special','Work','Treasury Audit','Review your budget or finances and write down one improvement.','hard',true)
on conflict (id) do nothing;

insert into public.achievements (id, name, description, icon, metric, target, reward_coins, sort) values
 ('a_first','First Quest','Complete your first quest.','sword','quests',1,10,1),
 ('a_10','Apprentice','Complete 10 quests.','shield','quests',10,30,2),
 ('a_50','Veteran','Complete 50 quests.','medal','quests',50,100,3),
 ('a_100','Centurion','Complete 100 quests.','crown','quests',100,250,4),
 ('a_lvl2','First Level Up','Reach level 2.','arrowup','level',2,15,5),
 ('a_lvl10','Rising Hero','Reach level 10.','star','level',10,150,6),
 ('a_streak7','7-Day Streak','Complete quests 7 days in a row.','flame','streak',7,60,7),
 ('a_streak30','30-Day Streak','Complete quests 30 days in a row.','bolt','streak',30,300,8),
 ('a_special','Boss Slayer','Complete your first Special quest.','skull','special',1,50,9),
 ('a_pet','Best Friend','Unlock a second companion.','paw','companions',2,40,10),
 ('a_friend','Party Up','Make your first friend.','users','friends',1,25,11),
 ('a_coins','Treasure Hunter','Earn 1000 Coins in total.','coin','coins',1000,100,12)
on conflict (id) do nothing;
