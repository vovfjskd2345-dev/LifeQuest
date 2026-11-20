// GENERATED from supabase/schema.sql (demo mode only). Do not edit by hand.
export const SEED = {
 "shop_items": [
  {
   "id": "pet_gloop",
   "category": "companion",
   "name": "Gloop the Slime",
   "description": "A bouncy cyan slime. Squishes happily when you win.",
   "price": 150,
   "min_level": 1,
   "data": {},
   "sort": 1
  },
  {
   "id": "pet_ember",
   "category": "companion",
   "name": "Ember the Fox",
   "description": "A clever little fox with a flickering tail.",
   "price": 150,
   "min_level": 1,
   "data": {},
   "sort": 2
  },
  {
   "id": "pet_bit",
   "category": "companion",
   "name": "Bit the Bot",
   "description": "A tiny robot who beeps with every victory.",
   "price": 150,
   "min_level": 1,
   "data": {},
   "sort": 3
  },
  {
   "id": "pet_mochi",
   "category": "companion",
   "name": "Mochi the Bunny",
   "description": "Soft, shy and always ready to hop.",
   "price": 300,
   "min_level": 3,
   "data": {},
   "sort": 4
  },
  {
   "id": "pet_nox",
   "category": "companion",
   "name": "Nox the Owl",
   "description": "A wise night owl who swivels to watch your progress.",
   "price": 500,
   "min_level": 6,
   "data": {},
   "sort": 5
  },
  {
   "id": "pet_drako",
   "category": "companion",
   "name": "Drako the Dragonling",
   "description": "A baby dragon. Breathes sparks when you level up.",
   "price": 900,
   "min_level": 10,
   "data": {},
   "sort": 6
  },
  {
   "id": "cos_wizard",
   "category": "cosmetic",
   "name": "Wizard Hat",
   "description": "A starry hat for the arcane adventurer.",
   "price": 120,
   "min_level": 1,
   "data": {
    "slot": "hat"
   },
   "sort": 10
  },
  {
   "id": "cos_crown",
   "category": "cosmetic",
   "name": "Golden Crown",
   "description": "Only for heroes who have proven themselves.",
   "price": 300,
   "min_level": 5,
   "data": {
    "slot": "hat"
   },
   "sort": 11
  },
  {
   "id": "cos_visor",
   "category": "cosmetic",
   "name": "Neon Visor",
   "description": "A cyber visor that glows across your eyes.",
   "price": 180,
   "min_level": 2,
   "data": {
    "slot": "face"
   },
   "sort": 12
  },
  {
   "id": "cos_cape",
   "category": "cosmetic",
   "name": "Royal Cape",
   "description": "A flowing crimson cape.",
   "price": 250,
   "min_level": 3,
   "data": {
    "slot": "cape"
   },
   "sort": 13
  },
  {
   "id": "cos_aura_cyan",
   "category": "cosmetic",
   "name": "Cyan Aura",
   "description": "A calm, glowing aura.",
   "price": 200,
   "min_level": 2,
   "data": {
    "slot": "aura"
   },
   "sort": 14
  },
  {
   "id": "cos_aura_flame",
   "category": "cosmetic",
   "name": "Flame Aura",
   "description": "A burning violet-orange aura.",
   "price": 400,
   "min_level": 6,
   "data": {
    "slot": "aura"
   },
   "sort": 15
  },
  {
   "id": "theme_neon",
   "category": "theme",
   "name": "Neon Grid",
   "description": "The default sci-fi look: navy, cyan and violet.",
   "price": 0,
   "min_level": 1,
   "data": {},
   "sort": 20
  },
  {
   "id": "theme_aurora",
   "category": "theme",
   "name": "Aurora Peak",
   "description": "Snowy peaks under a green and violet aurora.",
   "price": 400,
   "min_level": 3,
   "data": {},
   "sort": 21
  },
  {
   "id": "theme_forge",
   "category": "theme",
   "name": "Ember Forge",
   "description": "A volcanic forge with drifting embers.",
   "price": 500,
   "min_level": 4,
   "data": {},
   "sort": 22
  },
  {
   "id": "theme_ocean",
   "category": "theme",
   "name": "Abyssal Reef",
   "description": "Deep ocean light, bubbles and coral.",
   "price": 450,
   "min_level": 4,
   "data": {},
   "sort": 23
  },
  {
   "id": "theme_void",
   "category": "theme",
   "name": "Void Station",
   "description": "A derelict space station among the stars.",
   "price": 800,
   "min_level": 8,
   "data": {},
   "sort": 24
  },
  {
   "id": "bg_meadow",
   "category": "background",
   "name": "Moonlit Meadow",
   "description": "Rolling hills, fireflies and a big moon.",
   "price": 150,
   "min_level": 1,
   "data": {},
   "sort": 30
  },
  {
   "id": "bg_cave",
   "category": "background",
   "name": "Crystal Cave",
   "description": "Glowing crystals in a quiet cavern.",
   "price": 250,
   "min_level": 3,
   "data": {},
   "sort": 31
  },
  {
   "id": "bg_space",
   "category": "background",
   "name": "Orbit Deck",
   "description": "Stars, planets and a distant nebula.",
   "price": 300,
   "min_level": 5,
   "data": {},
   "sort": 32
  },
  {
   "id": "bg_castle",
   "category": "background",
   "name": "Sky Castle",
   "description": "Towers floating above the clouds.",
   "price": 450,
   "min_level": 7,
   "data": {},
   "sort": 33
  },
  {
   "id": "title_novice",
   "category": "title",
   "name": "Novice Adventurer",
   "description": "Everyone starts somewhere.",
   "price": 0,
   "min_level": 1,
   "data": {},
   "sort": 40
  },
  {
   "id": "title_early",
   "category": "title",
   "name": "Early Bird",
   "description": "For those who win the morning.",
   "price": 100,
   "min_level": 1,
   "data": {},
   "sort": 41
  },
  {
   "id": "title_scholar",
   "category": "title",
   "name": "Scholar",
   "description": "Knowledge is the best loot.",
   "price": 150,
   "min_level": 2,
   "data": {},
   "sort": 42
  },
  {
   "id": "title_ironwill",
   "category": "title",
   "name": "Iron Will",
   "description": "Unbreakable discipline.",
   "price": 250,
   "min_level": 4,
   "data": {},
   "sort": 43
  },
  {
   "id": "title_legend",
   "category": "title",
   "name": "Living Legend",
   "description": "Songs will be sung of you.",
   "price": 600,
   "min_level": 10,
   "data": {},
   "sort": 44
  },
  {
   "id": "fx_stars",
   "category": "other",
   "name": "Starlight Trail",
   "description": "Level-up bursts use golden stars.",
   "price": 200,
   "min_level": 2,
   "data": {
    "slot": "fx",
    "fx": "stars"
   },
   "sort": 50
  },
  {
   "id": "fx_hearts",
   "category": "other",
   "name": "Heart Burst",
   "description": "Level-up bursts use floating hearts.",
   "price": 200,
   "min_level": 2,
   "data": {
    "slot": "fx",
    "fx": "hearts"
   },
   "sort": 51
  }
 ],
 "quest_templates": [
  {
   "id": "d_water",
   "kind": "daily",
   "topic": "Health",
   "name": "Hydration Potion",
   "description": "Drink at least 2 litres of water today.",
   "difficulty": "easy",
   "requires_proof": false
  },
  {
   "id": "d_workout",
   "kind": "daily",
   "topic": "Health",
   "name": "Training Ground",
   "description": "Complete a 20-minute workout.",
   "difficulty": "medium",
   "requires_proof": true
  },
  {
   "id": "d_read",
   "kind": "daily",
   "topic": "Mind",
   "name": "Scroll of Wisdom",
   "description": "Read for 15 minutes.",
   "difficulty": "easy",
   "requires_proof": false
  },
  {
   "id": "d_tidy",
   "kind": "daily",
   "topic": "Home",
   "name": "Clear the Lair",
   "description": "Tidy your space for 10 minutes.",
   "difficulty": "easy",
   "requires_proof": false
  },
  {
   "id": "d_focus",
   "kind": "daily",
   "topic": "Work",
   "name": "Deep Focus Ritual",
   "description": "One 45-minute distraction-free work session.",
   "difficulty": "medium",
   "requires_proof": false
  },
  {
   "id": "d_study",
   "kind": "daily",
   "topic": "Study",
   "name": "Arcane Study",
   "description": "Study or practise a skill for 30 minutes.",
   "difficulty": "medium",
   "requires_proof": false
  },
  {
   "id": "d_cook",
   "kind": "daily",
   "topic": "Health",
   "name": "Campfire Cooking",
   "description": "Cook a healthy meal.",
   "difficulty": "medium",
   "requires_proof": true
  },
  {
   "id": "d_friend",
   "kind": "daily",
   "topic": "Social",
   "name": "Send a Raven",
   "description": "Message a friend or family member.",
   "difficulty": "easy",
   "requires_proof": false
  },
  {
   "id": "d_create",
   "kind": "daily",
   "topic": "Creative",
   "name": "Spark of Creation",
   "description": "Draw, write or play music for 15 minutes.",
   "difficulty": "easy",
   "requires_proof": false
  },
  {
   "id": "w_run",
   "kind": "weekly",
   "topic": "Health",
   "name": "Long Road",
   "description": "Walk or run 10 km in total this week.",
   "difficulty": "hard",
   "requires_proof": true
  },
  {
   "id": "w_read",
   "kind": "weekly",
   "topic": "Mind",
   "name": "Tome Hunter",
   "description": "Read 100 pages this week.",
   "difficulty": "hard",
   "requires_proof": false
  },
  {
   "id": "w_clean",
   "kind": "weekly",
   "topic": "Home",
   "name": "Dungeon Cleanse",
   "description": "Deep clean one room.",
   "difficulty": "medium",
   "requires_proof": true
  },
  {
   "id": "w_skill",
   "kind": "weekly",
   "topic": "Study",
   "name": "Skill Tree",
   "description": "Spend 3 hours learning something new.",
   "difficulty": "hard",
   "requires_proof": false
  },
  {
   "id": "w_meet",
   "kind": "weekly",
   "topic": "Social",
   "name": "Guild Meeting",
   "description": "Meet someone in person.",
   "difficulty": "medium",
   "requires_proof": false
  },
  {
   "id": "s_project",
   "kind": "special",
   "topic": "Work",
   "name": "Boss Raid: Milestone",
   "description": "Finish a meaningful milestone of a personal project.",
   "difficulty": "epic",
   "requires_proof": true
  },
  {
   "id": "s_adventure",
   "kind": "special",
   "topic": "Creative",
   "name": "Side Quest: Try Something New",
   "description": "Do something you have never done before.",
   "difficulty": "hard",
   "requires_proof": true
  },
  {
   "id": "s_detox",
   "kind": "special",
   "topic": "Mind",
   "name": "Digital Detox",
   "description": "Spend 4 hours without your phone.",
   "difficulty": "hard",
   "requires_proof": true
  },
  {
   "id": "s_5k",
   "kind": "special",
   "topic": "Health",
   "name": "The 5K Trial",
   "description": "Run or walk a full 5 km in one go.",
   "difficulty": "epic",
   "requires_proof": true
  },
  {
   "id": "s_recipe",
   "kind": "special",
   "topic": "Creative",
   "name": "Master Chef",
   "description": "Cook a recipe you have never made before.",
   "difficulty": "hard",
   "requires_proof": true
  },
  {
   "id": "s_declutter",
   "kind": "special",
   "topic": "Home",
   "name": "Great Purge",
   "description": "Declutter a closet, drawer or shelf and give things away.",
   "difficulty": "hard",
   "requires_proof": true
  },
  {
   "id": "s_lesson",
   "kind": "special",
   "topic": "Study",
   "name": "Chapter Boss",
   "description": "Finish a full lesson, chapter or course module.",
   "difficulty": "hard",
   "requires_proof": true
  },
  {
   "id": "s_meetup",
   "kind": "special",
   "topic": "Social",
   "name": "Reunion",
   "description": "Meet someone you have not seen in over a month.",
   "difficulty": "hard",
   "requires_proof": true
  },
  {
   "id": "s_nature",
   "kind": "special",
   "topic": "Health",
   "name": "Wild Expedition",
   "description": "Spend an hour walking outdoors in nature.",
   "difficulty": "medium",
   "requires_proof": true
  },
  {
   "id": "s_journal",
   "kind": "special",
   "topic": "Mind",
   "name": "Memory Scroll",
   "description": "Write a full-page reflection about your week.",
   "difficulty": "medium",
   "requires_proof": true
  },
  {
   "id": "s_budget",
   "kind": "special",
   "topic": "Work",
   "name": "Treasury Audit",
   "description": "Review your budget or finances and write down one improvement.",
   "difficulty": "hard",
   "requires_proof": true
  }
 ],
 "achievements": [
  {
   "id": "a_first",
   "name": "First Quest",
   "description": "Complete your first quest.",
   "icon": "sword",
   "metric": "quests",
   "target": 1,
   "reward_coins": 10,
   "sort": 1
  },
  {
   "id": "a_10",
   "name": "Apprentice",
   "description": "Complete 10 quests.",
   "icon": "shield",
   "metric": "quests",
   "target": 10,
   "reward_coins": 30,
   "sort": 2
  },
  {
   "id": "a_50",
   "name": "Veteran",
   "description": "Complete 50 quests.",
   "icon": "medal",
   "metric": "quests",
   "target": 50,
   "reward_coins": 100,
   "sort": 3
  },
  {
   "id": "a_100",
   "name": "Centurion",
   "description": "Complete 100 quests.",
   "icon": "crown",
   "metric": "quests",
   "target": 100,
   "reward_coins": 250,
   "sort": 4
  },
  {
   "id": "a_lvl2",
   "name": "First Level Up",
   "description": "Reach level 2.",
   "icon": "arrowup",
   "metric": "level",
   "target": 2,
   "reward_coins": 15,
   "sort": 5
  },
  {
   "id": "a_lvl10",
   "name": "Rising Hero",
   "description": "Reach level 10.",
   "icon": "star",
   "metric": "level",
   "target": 10,
   "reward_coins": 150,
   "sort": 6
  },
  {
   "id": "a_streak7",
   "name": "7-Day Streak",
   "description": "Complete quests 7 days in a row.",
   "icon": "flame",
   "metric": "streak",
   "target": 7,
   "reward_coins": 60,
   "sort": 7
  },
  {
   "id": "a_streak30",
   "name": "30-Day Streak",
   "description": "Complete quests 30 days in a row.",
   "icon": "bolt",
   "metric": "streak",
   "target": 30,
   "reward_coins": 300,
   "sort": 8
  },
  {
   "id": "a_special",
   "name": "Boss Slayer",
   "description": "Complete your first Special quest.",
   "icon": "skull",
   "metric": "special",
   "target": 1,
   "reward_coins": 50,
   "sort": 9
  },
  {
   "id": "a_pet",
   "name": "Best Friend",
   "description": "Unlock a second companion.",
   "icon": "paw",
   "metric": "companions",
   "target": 2,
   "reward_coins": 40,
   "sort": 10
  },
  {
   "id": "a_friend",
   "name": "Party Up",
   "description": "Make your first friend.",
   "icon": "users",
   "metric": "friends",
   "target": 1,
   "reward_coins": 25,
   "sort": 11
  },
  {
   "id": "a_coins",
   "name": "Treasure Hunter",
   "description": "Earn 1000 Coins in total.",
   "icon": "coin",
   "metric": "coins",
   "target": 1000,
   "reward_coins": 100,
   "sort": 12
  }
 ],
 "pet_perks": [
  {
   "item_id": "pet_gloop",
   "xp_pct": 0,
   "coin_pct": 10,
   "topics": ""
  },
  {
   "item_id": "pet_ember",
   "xp_pct": 10,
   "coin_pct": 0,
   "topics": ""
  },
  {
   "item_id": "pet_bit",
   "xp_pct": 20,
   "coin_pct": 0,
   "topics": "Work,Study"
  },
  {
   "item_id": "pet_mochi",
   "xp_pct": 0,
   "coin_pct": 20,
   "topics": "Health,Home"
  },
  {
   "item_id": "pet_nox",
   "xp_pct": 20,
   "coin_pct": 0,
   "topics": "Mind,Creative"
  },
  {
   "item_id": "pet_drako",
   "xp_pct": 15,
   "coin_pct": 15,
   "topics": ""
  }
 ]
};
