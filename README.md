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

## Who can do what

- **Owner** (signed in with Google): everything, including deleting the auction and inviting collaborators.
- **Collaborators**: the owner copies an invite link from Setup → Share → Collaborators. The person opens it, signs in with Google and accepts. They can edit setup, approve bidders and run the auction room, but can't delete the auction or invite others. The owner can remove them or make a new link (the old one stops working).
- **Bidders**: open their team link, type their name and ask to bid. The owner or a collaborator approves them (Bidders button in the room, or Share tab). Names are unique per auction. A phone that drops out reconnects by itself.
- **Viewers**: anyone with the code or viewer link watches live; they can't bid.

Every rule above is enforced by `database_rules.json`, not just the pages.

## Players

Import from Excel/CSV (download the template on the Players tab) or add one by one. Each player can have a photo, position, preferred foot, special attributes (comma separated, e.g. `Captain, Free kicks`) and favourite player. Upload many photos at once by naming each file after the player.

## Running the room

- **Control room** (`room.html`) on your laptop; press 🖥 **Display** to open the projector screen (no controls, no host data; it can be opened on any computer).
- The timer never sells by itself: when it runs out, bidding closes and the player waits for you. Press **Sold now** (S), or **Reopen +10s** (T) to take more bids, or **Unsold** (U).
- **Undo unsold** puts the player who just went unsold back in the queue; ↩ in the unsold pool does the same for any unsold player.
- **Break** shows a countdown on every screen; **Next player** ends it.
- After **End auction**, setup is read-only until you press **Reopen auction**. Every team can share a squad card image or download its spreadsheet.
Optional **fair price** (Setup → Basics → Bidding): when only one team can still buy a player it must have, you can assign it at the lowest price paid in that category instead of the base price.
Shortcuts: N next · Space/P pause or resume · T +10s · S sold · U unsold · F full screen.
