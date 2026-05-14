# Conspiracy Pictionary

A two-player Pictionary-style room game for the Uncensored Media site.

## Files

- `pictionary.html` - main game page
- `styles/pictionary.css` - game styling
- `scripts/pictionary.js` - room, drawing, realtime, scoring logic
- `data/conspiracy-prompts.js` - prompt list
- `supabase/setup.sql` - Supabase table, policies, and realtime setup

## Supabase Setup

The page uses the site-wide Supabase client from `../../js/supabaseClient.js`, so there are no credentials to paste into this game.

Run this once before publishing/playing online:

1. Open Supabase.
2. Go to SQL Editor.
3. Paste everything from `supabase/setup.sql`.
4. Run it.

The SQL creates `public.pictionary_rooms`, enables RLS, and adds the table to the Supabase realtime publication.

## Online Requirements

- Players must be signed in on the site.
- Players must have a profile username.
- Supabase Auth must keep working on your GitHub Pages domain.
- `pictionary_rooms` must exist and realtime must be active.
- `game_scores` must already be configured for automatic leaderboard saves.

## How To Play

1. Player 1 signs in and creates a room.
2. Player 1 sends the room code to Player 2.
3. Player 2 signs in, enters the room code, and joins.
4. The drawer sees the prompt and draws.
5. The guesser types guesses.
6. Exact guesses score automatically, or the drawer can mark a close guess correct.
7. First to 5 wins, and both players' final match scores are saved automatically.
