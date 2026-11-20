# LifeQuest — RPG for real life

Quests → XP & Coins → levels, companions, cosmetics, themes, achievements, friends.
Plain HTML + ES modules (no build step), **Supabase** (Postgres, Auth, Storage), free hosting on **Cloudflare Pages**.

## 1. Try it instantly (no backend)
Serve this folder and open `/?demo=1` (e.g. `python3 -m http.server 8000`). Demo mode keeps everything in your browser and includes three bot players for the social features. Use `?demo=0` to leave it.

## 2. Real setup (≈10 minutes, all free)
1. Create a project at https://supabase.com.
2. **SQL Editor → New query**: paste all of `supabase/schema.sql` and run it. It creates tables, security policies, game-logic functions, the private `evidence` storage bucket and all seed data.
3. **Authentication → Providers → Email**: for quick testing turn off *Confirm email* (otherwise users confirm via email first; the app handles both).
4. **Project Settings → API**: copy the *Project URL* and *anon public key* into `js/config.js`.
5. **Authentication → URL Configuration**: add your site URL once deployed.

## 3. Deploy
- Push this folder to GitHub, then Cloudflare Pages → *Connect to Git* → framework preset **None**, build command empty, output directory `/`.
- No GitHub? Cloudflare Pages also has *Upload assets* (direct upload): unzip this project and drag the **contents** of the folder in (index.html must be at the top level).
- The app is an installable PWA (`manifest.webmanifest`, `sw.js`, `icons/`). Android Chrome: menu → *Install app*. iPhone Safari: Share → *Add to Home Screen*.
- Updating later: upload/push the new files; players get them on next open. Database changes go in as new SQL scripts.
- Share links look like `https://your-site/#/join/CODE`.

## How it stays secure
- Clients can **only read** tables (row-level security); nobody can write XP, Coins, quests or inventory directly — not even their own.
- All changes go through `SECURITY DEFINER` SQL functions that validate everything: reward amounts come from difficulty/type rules, `unique(user_id, template_id, period_key)` + a status check prevent duplicate rewards, purchases lock the profile row and check balance, level and ownership.
- Evidence quests need a **friend** to approve (`review_quest`); you can never approve your own. Custom quests give half rewards and are rate-limited (5/day, 3 special/week).
- Evidence files live in a private bucket under `<user id>/…`; only the owner and their friends can read them (signed URLs).

## Game rules
| | Easy | Medium | Hard | Epic (special only) |
|---|---|---|---|---|
| XP (daily ×1, weekly ×2, special ×3) | 10 | 25 | 50 | 100 |
| Coins | 5 | 12 | 25 | 50 |

Level N needs `100 + 40(N-1) + 10(N-1)²` XP. Daily quests reset each day, weekly each Monday, based on the player's own time zone (kept in sync with the device, so travel and daylight saving are handled; flying west never breaks a streak). Special quests rotate weekly: 3 per player, picked from a pool of 11, never repeating last week's, and expiring at local Monday 00:00. Statuses: Available → In progress → Pending review → Completed.

## Companion perks (server-side, fair)
The **active** companion adds a bonus to every completed quest (at least +1). Perks live in the `pet_perks` table, so you can rebalance them in SQL without touching the app.

| Companion | Perk |
|---|---|
| Gloop | +10% Coins on every quest |
| Ember | +10% XP on every quest |
| Bit | +20% XP on Work & Study quests |
| Mochi | +20% Coins on Health & Home quests |
| Nox | +20% XP on Mind & Creative quests |
| Drako | +15% XP & Coins on every quest |

Bonuses apply to the base quest reward, never stack, and can't be edited by players. If you already ran an older `schema.sql`, run the new file again (it is safe to repeat).

## Structure
```
index.html            css/app.css
js/main.js            router, HUD, navigation
js/api.js             Supabase client + all server calls
js/sprites.js         six pixel-art companions (idle, blink, tap, XP hop, level-up) + avatar
js/themes.js          5 themes, 4 backgrounds, full-profile theme preview
js/pages/*.js         home, quests, shop, profile, stats, friends, friend, auth
js/mock.js, seed.js   demo mode only (seed.js is generated from schema.sql)
supabase/schema.sql   database, security, game logic, seed data
```

## Adding content
Add rows to `shop_items`, `quest_templates`, `achievements` in SQL (new companions also need a sprite in `sprites.js`; new cosmetics a drawing in `avatarHTML`). Re-generate `js/seed.js` for demo mode if you change seeds.
