# BidArena

Live player auctions for tournaments. The host runs setup and the auction room from a PC; teams bid from their phones with one tap.

- `index.html`: landing page, team phones and viewers
- `host.html`: auction setup (sport, money, categories, teams, players, photos, share links)
- `room.html`: the auction room for the big screen (host only)
- `database_rules.json`: Firebase Realtime Database rules (paste into the Firebase console and publish)

## Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/nifty1303/BidArena)

Uses `render.yaml` (free static site). Pushes to `main` redeploy automatically.

After the first deploy, in the Firebase console (project `quiz-f49a7`):
1. Realtime Database → Rules: paste `database_rules.json` and press Publish.
2. Authentication → Sign-in method: enable Google and Anonymous.
3. Authentication → Settings → Authorized domains: add your Render address, e.g. `bidarena.onrender.com`.

## Players

Import from Excel/CSV (download the template on the Players tab) or add one by one. Each player can have a photo, position, preferred foot, special attributes (comma separated, e.g. `Captain, Free kicks`) and favourite player. Upload many photos at once by naming each file after the player.

## Running the room

Keep the room tab open on the host PC: a player is sold when the timer runs out on that screen.
Shortcuts: N next · Space/P pause or resume · T +10s · S sold · U unsold · F full screen.
