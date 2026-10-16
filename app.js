// ============================================================
// CrowdPulse Auction · shared code for every page
// ============================================================
import { firebaseConfig } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, onValue, get, set, update, push, serverTimestamp, onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export { ref, onValue, get, set, update, push, serverTimestamp, onDisconnect };

export const APP_NAME = "BidArena";   // rename the app here

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

// ---------- one clock for everyone (so every countdown matches) ----------
let serverOffset = 0;
onValue(ref(db, ".info/serverTimeOffset"), snap => { serverOffset = snap.val() || 0; });
export const serverNow = () => Date.now() + serverOffset;

// ---------- sign-in ----------
// Hosts use Google. Teams and viewers are signed in invisibly (no account).
export function currentUser() {
  return new Promise(resolve => {
    const stop = onAuthStateChanged(auth, user => { stop(); resolve(user); });
  });
}
export const isHostAccount = user => !!user && !user.isAnonymous;
export async function signInHost() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return (await signInWithPopup(auth, provider)).user;
}
export async function ensureGuest() {
  const user = await currentUser();
  return user || (await signInAnonymously(auth)).user;
}
export const signOutUser = () => signOut(auth);

// ---------- connection ----------
// cb(true/false) whenever this device connects to or loses the database
export const watchConnection = cb => onValue(ref(db, ".info/connected"), snap => cb(!!snap.val()));

// ---------- bidder names (one name per person, unique in an auction) ----------
export const cleanName = n => String(n || "").replace(/[.#$\[\]\/]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
export const nameKeyOf = n => cleanName(n).toLowerCase();

// ---------- small helpers ----------
export function safe(text) {
  return String(text ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function animate(el) {
  if (!el) return;
  el.classList.remove("swap");
  void el.offsetWidth;
  el.classList.add("swap");
}

export const initials = name => String(name || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase() || "?";

// Codes people type: no 0/O/1/I/L so they can't be misread
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const makeCode = (len = 6) => Array.from({ length: len }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
export const makePin = () => String(Math.floor(1000 + Math.random() * 9000));
export const newId = () => Math.random().toString(36).slice(2, 10);

export const TEAM_COLOURS = ["#FFC93C", "#E4572E", "#2E9E6B", "#3A7BD5", "#9B5DE5", "#F15BB5", "#00B8C9", "#FF8C42", "#8AC926", "#6C757D"];

// ---------- auction rules ----------
export const MIN_TEAMS = 2, MAX_TEAMS = 10, MAX_CATS = 8;
export const NO_LIMIT = 999;

export const UNSOLD_RULES = {
  afterCategory: "Re-auction right after this category",
  afterAll: "Re-auction after all categories",
  wishlist: "Re-auction only if teams wishlist them"
};

export const SQUAD_MODES = {
  range: "Between",
  min: "At least",
  max: "At most",
  exact: "Exactly"
};

export const DEFAULT_SETTINGS = {
  sport: "", currency: "BDT",
  unit: "৳", unitAfter: false,
  purse: 1000,
  squadMode: "range", squadMin: 11, squadMax: 15,
  timerSec: 20,
  order: "listed",
  fairForced: false,       // a player only one team can buy goes at the category's lowest sale price
  cats: {
    bat:  { name: "Batters",       min: 3, max: 6, base: 50, step: 10, unsold: "afterAll", order: 1 },
    bowl: { name: "Bowlers",       min: 3, max: 6, base: 50, step: 10, unsold: "afterAll", order: 2 },
    ar:   { name: "All-rounders",  min: 2, max: 5, base: 60, step: 10, unsold: "afterAll", order: 3 },
    wk:   { name: "Wicketkeepers", min: 1, max: 2, base: 40, step: 5,  unsold: "wishlist", order: 4 }
  }
};

export function money(n, s = DEFAULT_SETTINGS) {
  const v = Number(n || 0).toLocaleString();
  const c = CURRENCIES[s && s.currency];
  const unit = c ? c.unit : (s && s.unit) || "৳", after = c ? c.after : !!(s && s.unitAfter);
  return after ? `${v} ${unit}` : `${unit}${v}`;
}

// ============================================================
// Currencies
// ============================================================
export const CURRENCIES = {
  USD: { name: "US Dollar (USD)", unit: "$", after: false },
  GBP: { name: "British Pound (GBP)", unit: "£", after: false },
  BDT: { name: "Bangladeshi Taka (BDT)", unit: "৳", after: false },
  PTS: { name: "Points", unit: "pts", after: true }
};

// ============================================================
// Sports
// ============================================================
// Cricket and Football always come first; the rest are alphabetical.
export const SPORTS = [
  { id: "cricket", name: "Cricket", icon: "🏏" },
  { id: "football", name: "Football", icon: "⚽" },
  ...[
    ["american-football", "American Football", "🏈"], ["archery", "Archery", "🏹"], ["athletics", "Athletics", "🏃"],
    ["badminton", "Badminton", "🏸"], ["baseball", "Baseball", "⚾"], ["basketball", "Basketball", "🏀"],
    ["boxing", "Boxing", "🥊"], ["carrom", "Carrom", "🎯"], ["chess", "Chess", "♟️"], ["cycling", "Cycling", "🚴"],
    ["darts", "Darts", "🎯"], ["esports", "E-sports", "🎮"], ["field-hockey", "Field Hockey", "🏑"], ["futsal", "Futsal", "⚽"],
    ["golf", "Golf", "⛳"], ["handball", "Handball", "🤾"], ["ice-hockey", "Ice Hockey", "🏒"], ["kabaddi", "Kabaddi", "🤼"],
    ["kho-kho", "Kho Kho", "🏃"], ["martial-arts", "Martial Arts", "🥋"], ["netball", "Netball", "🏐"], ["pickleball", "Pickleball", "🏓"],
    ["rugby", "Rugby", "🏉"], ["snooker", "Snooker / Pool", "🎱"], ["softball", "Softball", "🥎"], ["squash", "Squash", "🎾"],
    ["swimming", "Swimming", "🏊"], ["table-tennis", "Table Tennis", "🏓"], ["tennis", "Tennis", "🎾"],
    ["volleyball", "Volleyball", "🏐"], ["wrestling", "Wrestling", "🤼"], ["other", "Other sport", "🏆"]
  ].map(([id, name, icon]) => ({ id, name, icon }))
];
export const sportOf = id => SPORTS.find(x => x.id === id) || null;
export const sportName = id => (sportOf(id) || { name: "Sport not set" }).name;
export const sportIcon = id => (sportOf(id) || { icon: "🏆" }).icon;

// What we record about each player, per sport. Cricket and Football are detailed; others are basic.
export const SCHEMAS = {
  cricket: {
    roleLabel: "Type", subLabel: "Subtype",
    roles: {
      bat:  { name: "Batsman",       subs: [["Opener", "open"], ["Top Order", "top"], ["Middle Order", "middle", "mid"]] },
      bowl: { name: "Bowler",        subs: [["Fast", "fast", "pace", "express", "quick"], ["Medium", "medium", "seam", "swing"], ["Leg Spin", "leg", "wrist"], ["Off Spin", "off", "finger"], ["Chinaman", "chinaman", "leftarmwrist", "leftarmunorthodox"]] },
      ar:   { name: "All Rounder",   subs: [["Batting All Rounder", "batting", "bat"], ["Bowling All Rounder", "bowling", "bowl"]] },
      wk:   { name: "Wicket Keeper", subs: [["Opener", "open"], ["Top Order", "top"], ["Middle Order", "middle", "mid"]] }
    },
    extra: [
      { key: "batHand", label: "Batting hand", options: [["R", "Right"], ["L", "Left"]] },
      { key: "bowlHand", label: "Bowling hand", options: [["R", "Right"], ["L", "Left"]] }
    ]
  },
  football: {
    roleLabel: "Position", subLabel: "Role",
    roles: {
      gk:  { name: "Goalkeeper", subs: [] },
      def: { name: "Defender",   subs: [["Centre Back", "centre", "center", "cb"], ["Full Back", "full", "lb", "rb", "fb"], ["Wing Back", "wingback", "lwb", "rwb"]] },
      mid: { name: "Midfielder", subs: [["Defensive Mid", "defensive", "cdm", "dm", "holding"], ["Central Mid", "central", "cm", "box"], ["Attacking Mid", "attacking", "cam", "am", "playmaker"], ["Wide Mid", "wide", "lm", "rm"]] },
      fwd: { name: "Forward",    subs: [["Winger", "wing", "lw", "rw"], ["Striker", "striker", "st"], ["Centre Forward", "centre", "center", "cf"], ["Second Striker", "second", "ss"]] }
    },
    extra: [{ key: "foot", label: "Preferred foot", options: [["R", "Right"], ["L", "Left"], ["B", "Both"]] }]
  }
};
export const schemaFor = sport => SCHEMAS[sport] || null;

// Starting categories and squad size when a sport is picked
export function sportDefaults(sport) {
  const c = (name, min, max, base, step, unsold, order) => ({ name, min, max, base, step, unsold, order });
  if (sport === "cricket") return { squadMode: "range", squadMin: 11, squadMax: 15, cats: {
    bat: c("Batters", 3, 6, 50, 10, "afterAll", 1), bowl: c("Bowlers", 3, 6, 50, 10, "afterAll", 2),
    ar: c("All-rounders", 2, 5, 60, 10, "afterAll", 3), wk: c("Wicketkeepers", 1, 2, 40, 5, "wishlist", 4) } };
  if (sport === "football") return { squadMode: "range", squadMin: 11, squadMax: 16, cats: {
    gk: c("Goalkeepers", 1, 2, 40, 5, "wishlist", 1), def: c("Defenders", 4, 6, 50, 10, "afterAll", 2),
    mid: c("Midfielders", 3, 6, 50, 10, "afterAll", 3), fwd: c("Forwards", 2, 4, 60, 10, "afterAll", 4) } };
  return { squadMode: "range", squadMin: 5, squadMax: 10, cats: {
    icon: c("Icon", 1, 2, 100, 20, "afterAll", 1), pro: c("Premium", 1, 4, 60, 10, "afterAll", 2),
    std: c("Standard", 0, 0, 30, 5, "afterAll", 3) } };
}

const hand = v => ({ R: "Right", L: "Left", B: "Both" })[v] || "";
// Short labels that describe a player (used on the big screen, phones and lists)
export function playerTags(p, s) {
  const sch = schemaFor(s && s.sport);
  const tags = [];
  if (p.age) tags.push(`Age ${p.age}`);
  if (sch) {
    const r = sch.roles[p.role];
    if (r) tags.push(r.name);
    if (p.sub) tags.push(p.sub);
    if (s.sport === "cricket") {
      if (p.batHand) tags.push(`${hand(p.batHand)}-hand bat`);
      if (p.bowlHand) tags.push(`${hand(p.bowlHand)}-arm bowl`);
    } else if (p.foot) tags.push(p.foot === "B" ? "Two-footed" : `${hand(p.foot)}-footed`);
  }
  if (p.info) tags.push(p.info);
  attrsOf(p).forEach(a => tags.push(a));
  if (p.fav) tags.push(`Favourite: ${p.fav}`);
  return tags;
}
export const playerLine = (p, s) => playerTags(p, s).join(" · ");

// Special attributes are typed as a list: "Captain, Free kicks, Fast"
export const attrsOf = p => String((p && p.attrs) || "").split(/[,;|\n]/).map(x => x.trim()).filter(Boolean).slice(0, 8);

// "Forward · Striker" (or "" when the sport has no positions)
export function positionOf(p, s) {
  const r = schemaFor(s && s.sport)?.roles[p.role];
  return r ? (p.sub ? `${r.name} · ${p.sub}` : r.name) : "";
}

// The player's full profile for the big screen and phones: position, details, attributes, favourite player
export function playerDetailsHTML(p, s) {
  const pos = positionOf(p, s);
  const small = [];
  if (p.age) small.push(`Age ${p.age}`);
  if (s && s.sport === "cricket") {
    if (p.batHand) small.push(`${hand(p.batHand)}-hand bat`);
    if (p.bowlHand) small.push(`${hand(p.bowlHand)}-arm bowl`);
  } else if (p.foot) small.push(p.foot === "B" ? "Two-footed" : `${hand(p.foot)}-footed`);
  if (p.info) small.push(p.info);
  const attrs = attrsOf(p);
  return `<div class="pd">
      ${pos ? `<span class="pos-badge"><small>${safe(schemaFor(s && s.sport)?.roleLabel || "Position")}</small>${safe(pos)}</span>` : ""}
      ${small.length ? `<p class="lot-info">${small.map(x => `<span class="tag">${safe(x)}</span>`).join("")}</p>` : ""}
      ${attrs.length ? `<p class="attrs">${attrs.map(x => `<span class="attr">★ ${safe(x)}</span>`).join("")}</p>` : ""}
      ${p.fav ? `<p class="fav">❤️ Favourite player: <b>${safe(p.fav)}</b></p>` : ""}
    </div>`;
}

// Turns whatever someone typed in a spreadsheet into our codes
export const norm = v => String(v ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
export function matchRole(sport, text) {
  const t = norm(text);
  if (!t) return "";
  if (sport === "cricket") {
    if (t.includes("allround") || t === "ar") return "ar";
    if (t.includes("keep") || t === "wk") return "wk";
    if (t.includes("bowl")) return "bowl";
    if (t.includes("bat")) return "bat";
  }
  if (sport === "football") {
    if (t.includes("goal") || t === "gk" || t === "keeper") return "gk";
    if (t.includes("def") || t.includes("back") || ["cb", "lb", "rb", "lwb", "rwb"].includes(t)) return "def";
    if (t.includes("mid") || ["cm", "cdm", "cam", "dm", "am", "lm", "rm"].includes(t)) return "mid";
    if (t.includes("forward") || t.includes("strik") || t.includes("wing") || t.includes("attack") || ["fw", "st", "cf", "ss", "lw", "rw"].includes(t)) return "fwd";
  }
  const sch = schemaFor(sport);
  if (sch) for (const [k, r] of Object.entries(sch.roles)) if (norm(r.name) === t || k === t) return k;
  return "";
}
export function matchSub(sport, role, text) {
  const r = schemaFor(sport)?.roles[role];
  const t = norm(text);
  if (!r || !t) return "";
  const exact = r.subs.find(([name]) => norm(name) === t);
  if (exact) return exact[0];
  const hit = r.subs.find(([, ...keys]) => keys.some(k => t === k || t.startsWith(k)));
  return hit ? hit[0] : "";
}
export function matchHand(text, allowBoth = false) {
  const t = norm(text);
  if (!t) return "";
  if (allowBoth && (t.startsWith("b") || t.includes("either") || t.includes("two"))) return "B";
  if (t.startsWith("r")) return "R";
  if (t.startsWith("l")) return "L";
  return "";
}
export function cleanAge(v) {
  const n = parseInt(v, 10);
  return n >= 5 && n <= 80 ? n : "";
}

// ---------- the sport's look (background photo + accent colour) ----------
export function applySportTheme(sport) {
  document.body.dataset.sport = !sport ? "home" : (sport === "cricket" || sport === "football") ? sport : "other";
}

// ---------- searchable sport picker ----------
// mountSportPicker(element, currentId, onPick, { disabled })
export function mountSportPicker(host, value, onPick, opts = {}) {
  let current = value || "";
  let pinned = SPORTS.slice(0, 2), rest = SPORTS.slice(2);
  host.classList.add("combo");
  host.innerHTML = `<button type="button" class="combo-btn"></button>
    <div class="combo-pop" hidden><input class="input" placeholder="Search sports" aria-label="Search sports"><ul class="combo-list" role="listbox"></ul></div>`;
  const btn = host.querySelector(".combo-btn"), pop = host.querySelector(".combo-pop"),
        search = host.querySelector("input"), list = host.querySelector(".combo-list");
  let shown = [], active = 0;
  const label = () => {
    const sp = sportOf(current);
    btn.classList.toggle("empty", !sp);
    btn.innerHTML = sp ? `<span class="ico">${sp.icon}</span>${safe(sp.name)}<span class="caret">▾</span>` : `Choose a sport<span class="caret">▾</span>`;
    btn.disabled = !!opts.disabled;
  };
  const draw = () => {
    const q = norm(search.value);
    shown = q ? SPORTS.filter(x => norm(x.name).includes(q)) : [...pinned, null, ...rest];
    const items = shown.filter(Boolean);
    active = Math.min(active, Math.max(0, items.length - 1));
    let k = -1;
    list.innerHTML = shown.length ? shown.map(x => {
      if (!x) return `<li class="sep" aria-hidden="true"></li>`;
      k++;
      return `<li role="option" data-id="${x.id}" class="${k === active ? "on" : ""} ${x.id === current ? "sel" : ""}"><span class="ico">${x.icon}</span>${safe(x.name)}</li>`;
    }).join("") : `<li class="none">No sport matches. Choose “Other sport”.</li>`;
    list.querySelector(".on")?.scrollIntoView({ block: "nearest" });
  };
  // lift the whole section above its neighbours while the list is open
  const lift = on => { const box = host.closest(".sec, .modal"); if (box) box.classList.toggle("raised", on); };
  const open = () => { pop.hidden = false; lift(true); search.value = ""; active = Math.max(0, SPORTS.findIndex(x => x.id === current)); draw(); search.focus(); };
  const close = () => { pop.hidden = true; lift(false); };
  const pick = id => { if (!id) return; current = id; label(); close(); onPick(id); };
  btn.onclick = () => (pop.hidden ? open() : close());
  search.oninput = () => { active = 0; draw(); };
  search.onkeydown = e => {
    const items = shown.filter(Boolean);
    if (e.key === "ArrowDown") { active = Math.min(items.length - 1, active + 1); draw(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { active = Math.max(0, active - 1); draw(); e.preventDefault(); }
    else if (e.key === "Enter") { e.preventDefault(); if (items[active]) pick(items[active].id); }
    else if (e.key === "Escape") { close(); btn.focus(); }
  };
  list.onclick = e => { const li = e.target.closest("[data-id]"); if (li) pick(li.dataset.id); };
  document.addEventListener("click", e => { if (!host.contains(e.target)) close(); });
  label();
  return { set(id) { current = id; label(); }, get: () => current };
}

// ---------- reading Excel / CSV files ----------
// Returns rows (arrays of text). Excel needs the SheetJS script on the page.
export async function readSheetFile(file) {
  const name = (file.name || "").toLowerCase();
  if (/\.(xlsx|xlsm|xls|ods)$/.test(name)) {
    if (!window.XLSX) throw new Error("The Excel reader didn't load. Check your internet, or save the sheet as CSV.");
    const wb = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return window.XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" })
      .map(r => r.map(c => String(c ?? "").trim())).filter(r => r.some(c => c !== ""));
  }
  return parseTable(await file.text());
}

// A team's budget: its own if the host set one, otherwise the default
export const teamBudget = (t, s) => (t && +t.budget > 0 ? +t.budget : +(s && s.purse) || 0);
export const purseLeftOf = (t, s) => (t && t.purseLeft != null ? t.purseLeft : teamBudget(t, s));

// Categories in auction order
export const catList = s => Object.entries((s && s.cats) || {})
  .map(([id, c]) => ({ id, name: c.name || "Category", min: Math.max(0, +c.min || 0), max: +c.max > 0 ? +c.max : 0,
                       base: Math.max(1, +c.base || 1), step: Math.max(1, +c.step || 1), unsold: c.unsold || "afterAll", order: +c.order || 0 }))
  .sort((a, b) => a.order - b.order);
export const catMax = c => (c.max > 0 ? c.max : NO_LIMIT);

// Squad size as a min–max range, whatever style the host picked
export function squadLimits(s) {
  const a = Math.max(0, +s.squadMin || 0), b = Math.max(0, +s.squadMax || 0);
  switch (s.squadMode) {
    case "min":   return { min: a, max: NO_LIMIT };
    case "max":   return { min: 0, max: Math.max(1, b) };
    case "exact": return { min: a, max: a };
    default:      return { min: a, max: Math.max(a, b) };
  }
}
export function squadText(s) {
  const l = squadLimits(s);
  if (s.squadMode === "exact") return `exactly ${l.min}`;
  if (s.squadMode === "min") return `at least ${l.min}`;
  if (s.squadMode === "max") return `at most ${l.max}`;
  return `${l.min}–${l.max}`;
}

// The next bid on the current player (each category has its own step)
export function stepFor(catId, s) {
  const c = catList(s).find(x => x.id === catId);
  return c ? c.step : 1;
}
export const nextBid = (live, s) => (live && live.team ? live.amount + stepFor(live.cat, s) : (live ? live.amount : 0));

// Money a team must keep back AFTER buying one more player in category catId,
// so it can still meet every category minimum and the squad minimum at base prices.
function reserveAfter(team, s, catId) {
  const cats = catList(s), lim = squadLimits(s);
  const counts = { ...((team && team.cat) || {}) };
  counts[catId] = (counts[catId] || 0) + 1;
  const total = ((team && team.count) || 0) + 1;
  let cost = 0, forced = 0;
  const need = {};
  cats.forEach(c => { need[c.id] = Math.max(0, c.min - (counts[c.id] || 0)); forced += need[c.id]; cost += need[c.id] * c.base; });
  const extra = Math.max(0, lim.min - total - forced);        // still short of the squad minimum
  const fill = cheapestFill(cats, c => catMax(c) - (counts[c.id] || 0) - need[c.id], extra);
  return isFinite(fill) ? cost + fill : Infinity;
}

// Cheapest way to buy `count` more players, filling the cheapest categories first (respecting their limits)
function cheapestFill(cats, roomOf, count) {
  let cost = 0, left = count;
  for (const c of [...cats].sort((a, b) => a.base - b.base)) {
    if (left <= 0) break;
    const take = Math.min(left, Math.max(0, roomOf(c)));
    cost += take * c.base;
    left -= take;
  }
  return left > 0 ? Infinity : cost;
}

// The most a team can bid right now for a player in category catId (0 = can't bid)
export function maxBidFor(team, s, catId) {
  const c = catList(s).find(x => x.id === catId);
  if (!team || !c) return 0;
  const lim = squadLimits(s);
  if ((team.count || 0) >= lim.max) return 0;                        // squad full
  if (((team.cat && team.cat[catId]) || 0) >= catMax(c)) return 0;   // category full
  const left = team.purseLeft || 0;
  const reserve = reserveAfter(team, s, catId);
  if (!isFinite(reserve)) return 0;
  const max = left - reserve;
  return max >= c.base ? max : 0;
}
export function allMaxBids(team, s) {
  const out = {};
  catList(s).forEach(c => { out[c.id] = maxBidFor(team, s, c.id); });
  return out;
}

// The cheapest squad that meets every rule (to check the budget is enough)
export function cheapestSquad(s) {
  const cats = catList(s), lim = squadLimits(s);
  let cost = 0, count = 0;
  cats.forEach(c => { cost += c.min * c.base; count += c.min; });
  const extra = Math.max(0, lim.min - count);
  const fill = cheapestFill(cats, c => catMax(c) - c.min, extra);
  return isFinite(fill) ? cost + fill : Infinity;
}

// Everything that would make the auction impossible or unfair
export function setupProblems(s, teams, players) {
  const out = [];
  const cats = catList(s), lim = squadLimits(s);
  const nTeams = Object.keys(teams || {}).length;
  const plist = Object.values(players || {});
  if (nTeams < MIN_TEAMS) out.push(`Add at least ${MIN_TEAMS} teams.`);
  if (nTeams > MAX_TEAMS) out.push(`There can be at most ${MAX_TEAMS} teams.`);
  if (!cats.length) out.push("Add at least one category.");
  if (cats.length > MAX_CATS) out.push(`There can be at most ${MAX_CATS} categories.`);
  if (!(s.purse > 0)) out.push("Set a default budget per team.");
  if (s.squadMode === "range" && (+s.squadMin || 0) > (+s.squadMax || 0)) out.push("The squad minimum is bigger than the maximum.");
  if (lim.max < 1) out.push("Teams must be able to buy at least one player.");
  cats.forEach(c => { if (c.max && c.min > c.max) out.push(`${c.name}: the minimum is bigger than the maximum.`); });
  const sumMin = cats.reduce((n, c) => n + c.min, 0);
  if (sumMin > lim.max) out.push(`The category minimums add up to ${sumMin}, more than the squad maximum (${lim.max}).`);
  const sumMax = cats.some(c => !c.max) ? NO_LIMIT : cats.reduce((n, c) => n + c.max, 0);
  if (sumMax < lim.min) out.push(`The category maximums add up to ${sumMax}, fewer than the squad minimum (${lim.min}).`);
  const cheapest = cheapestSquad(s);
  if (isFinite(cheapest)) Object.values(teams || {}).forEach(t => {
    const b = teamBudget(t, s);
    if (cheapest > b) out.push(`${t.name || "A team"}: the cheapest possible squad costs ${money(cheapest, s)} at base prices, more than its budget of ${money(b, s)}.`);
  });
  if (!plist.length) out.push("Add at least one player.");
  cats.forEach(c => {
    const have = plist.filter(p => p.cat === c.id).length;
    if (c.min && have < c.min * nTeams) out.push(`${c.name}: every team must buy ${c.min}, so you need at least ${c.min * nTeams} players, but there are ${have}.`);
  });
  const orphan = plist.filter(p => !cats.some(c => c.id === p.cat)).length;
  if (orphan) out.push(`${orphan} player${orphan === 1 ? " has" : "s have"} no category.`);
  return out;
}

// ---------- pictures ----------
export function compressPhoto(file, size = 360, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, size / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Big landing photos: as large as fits in one database entry (200 KB of text)
export async function compressBanner(file) {
  for (const [size, q] of [[1600, 0.72], [1280, 0.7], [1100, 0.62], [900, 0.6], [700, 0.55]]) {
    const src = await compressPhoto(file, size, q);
    if (src.length <= 195000) return src;
  }
  throw new Error("That picture is too detailed. Try a smaller one.");
}

// An auction's own landing photos (the host uploads them in setup)
export async function loadBanners(code, banners, cache) {
  const ids = Object.entries(banners || {}).sort((a, b) => (a[1].order || 0) - (b[1].order || 0)).map(([id]) => id);
  await Promise.all(ids.map(async id => {
    const v = banners[id].v || 0;
    if (cache[id] && cache[id].v === v) return;
    const snap = await get(ref(db, `auctionPhotos/${code}/b_${id}`));
    cache[id] = { v, src: snap.exists() ? snap.val() : "" };
  }));
  return ids.map(id => cache[id] && cache[id].src).filter(Boolean);
}
export function bannerHTML(srcs, cls = "") {
  if (!srcs.length) return "";
  return `<div class="a-banner ${cls}">${srcs.map((s, i) => `<img src="${s}" alt="" class="${i === 0 ? "on" : ""}">`).join("")}</div>`;
}
// Rotates every .a-banner on the page (call once)
let bannerTimer = null;
export function startBannerShow() {
  if (bannerTimer) return;
  bannerTimer = setInterval(() => document.querySelectorAll(".a-banner").forEach(box => {
    const imgs = [...box.querySelectorAll("img")];
    if (imgs.length < 2) return;
    const k = imgs.findIndex(i => i.classList.contains("on"));
    imgs.forEach((img, i) => img.classList.toggle("on", i === (k + 1) % imgs.length));
  }), 5000);
}
// Uses the auction's first photo as the page background (or the sport's photo if none)
export function setPageBackground(src) {
  if (src) document.body.style.setProperty("--bg-img", `url("${src}")`);
  else document.body.style.removeProperty("--bg-img");
}

// ---------- spreadsheets ----------
// Reads CSV or text pasted from Excel/Google Sheets (commas or tabs)
export function parseTable(text) {
  const rows = [];
  const sep = text.includes("\t") ? "\t" : ",";
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) { row.push(cell.trim()); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim()); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
  return rows.filter(r => r.some(c => c !== ""));
}

export function toCSV(rows) {
  return rows.map(r => r.map(v => {
    let t = String(v ?? "");
    if (/^[=+\-@]/.test(t)) t = "'" + t;
    return /[",\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  }).join(",")).join("\r\n");
}

export function downloadCSV(csv, name) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${String(name || "auction").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "auction"}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- sounds (made in the browser, no files) ----------
let audioCtx = null;
export function unlockAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) {}
}
function tone(freq, start, length, type = "sine", volume = 0.25, slideTo = null) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime + 0.02;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, now + start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, now + start + length);
  g.gain.setValueAtTime(0.0001, now + start);
  g.gain.exponentialRampToValueAtTime(volume, now + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, now + start + length);
  o.connect(g).connect(audioCtx.destination);
  o.start(now + start);
  o.stop(now + start + length + 0.05);
}
export const sounds = {
  bid()    { try { tone(880, 0, 0.09, "triangle", 0.18); tone(1320, 0.07, 0.12, "triangle", 0.14); } catch (e) {} },
  tick()   { try { tone(1500, 0, 0.05, "square", 0.05); } catch (e) {} },
  outbid() { try { tone(330, 0, 0.18, "sawtooth", 0.1, 220); } catch (e) {} },
  sold()   {
    try {
      tone(120, 0, 0.35, "sine", 0.6, 45);                                   // the hammer
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.18 + i * 0.07, 0.6, "triangle", 0.16));
    } catch (e) {}
  },
  unsold() { try { tone(392, 0, 0.25, "sine", 0.18, 330); tone(294, 0.22, 0.4, "sine", 0.16, 247); } catch (e) {} },
  going()  { try { tone(660, 0, 0.14, "square", 0.08); tone(660, 0.18, 0.14, "square", 0.08); } catch (e) {} },
  intro()  { try { [392, 523.25, 659.25].forEach((f, i) => tone(f, i * 0.09, 0.35, "sawtooth", 0.07)); } catch (e) {} }
};

// ---------- confetti in a team's colour ----------
export function confetti(host, colour) {
  const box = document.createElement("div");
  box.className = "confetti";
  const colours = [colour || "#D6FF3F", "#FFFFFF", "#D6FF3F"];
  box.innerHTML = Array.from({ length: 40 }, (_, i) => {
    const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 260;
    return `<i style="--x:${Math.round(Math.cos(a) * d)}px;--y:${Math.round(Math.sin(a) * d - 80)}px;--r:${Math.round(Math.random() * 720)}deg;background:${colours[i % 3]}"></i>`;
  }).join("");
  host.appendChild(box);
  setTimeout(() => box.remove(), 1800);
}

// ---------- the brand ----------
export const brandHTML = (tag = "Live auctions") => `
  <a class="brand" href="index.html" aria-label="${APP_NAME}">
    <span class="brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M14.5 3.5l6 6M12 6l6 6M10.5 7.5l6 6-2.5 2.5-6-6z"/><path d="M8.5 12.5L3 18l3 3 5.5-5.5"/></svg></span>
    <span class="brand-name">Bid<span>Arena</span></span>
    <span class="brand-tag">${safe(tag)}</span>
  </a>`;

// ---------- category colours (cards, chips, stage glow) ----------
export const CAT_COLOURS = ["#7B5CFF", "#2EE6FF", "#FF3D71", "#FFC53D", "#3DFFA0", "#FF8A3D", "#E056FD", "#D6FF3F"];
export function catColour(s, catId) {
  const i = catList(s).findIndex(c => c.id === catId);
  return CAT_COLOURS[(i < 0 ? 0 : i) % CAT_COLOURS.length];
}

// ---------- team crests (their picture, or initials in their colour) ----------
export function crestHTML(team, logo, size = "") {
  const t = team || {};
  return `<span class="crest ${size}" style="--c:${safe(t.color || "#7B5CFF")}">${logo ? `<img src="${logo}" alt="">` : safe(initials(t.name))}</span>`;
}

// Loads team pictures once, and again only when a team's picture changes
export async function loadTeamLogos(code, teams, cache) {
  let changed = false;
  await Promise.all(Object.entries(teams || {}).map(async ([id, t]) => {
    const v = t.logoV || 0;
    if (!v) { if (cache[id]) { delete cache[id]; changed = true; } return; }
    if (cache[id] && cache[id].v === v) return;
    const snap = await get(ref(db, `auctionPhotos/${code}/t_${id}`));
    cache[id] = { v, src: snap.exists() ? snap.val() : "" };
    changed = true;
  }));
  return changed;
}
export const logoOf = (cache, id) => (cache[id] && cache[id].src) || "";

// ---------- the bid clock ----------
// Each bid stamps clockFrom with the server's time; bidding closes timerMs after it.
export const endsAt = live => (live && live.clockFrom ? live.clockFrom : 0) + ((live && live.timerMs) || 0);


// ============================================================
// Dialogs (used instead of the browser's alert / confirm / prompt)
// ============================================================
const para = t => safe(t).split(/\n{2,}/).map(x => `<p>${x.replace(/\n/g, "<br>")}</p>`).join("");

// dialog({ title, message | html, icon, tone, buttons:[{label, value, kind}], dismiss, onMount(box, close) })
export function dialog(o) {
  return new Promise(resolve => {
    const buttons = o.buttons || [{ label: "OK", value: true, kind: "sun" }];
    const back = document.createElement("div");
    back.className = "modal-back dlg-back";
    back.innerHTML = `<section class="card modal dlg ${o.tone ? `dlg-${o.tone}` : ""} ${o.wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="dlgT">
        ${o.icon ? `<div class="dlg-ico" aria-hidden="true">${o.icon}</div>` : ""}
        <h2 class="dlg-title" id="dlgT">${safe(o.title || "")}</h2>
        <div class="dlg-body">${o.html || para(o.message || "")}</div>
        <div class="dlg-actions">${buttons.map((b, i) => `<button type="button" class="btn btn-${b.kind || "light"}" data-dlg="${i}">${safe(b.label)}</button>`).join("")}</div>
      </section>`;
    document.body.appendChild(back);
    const prev = document.activeElement;
    const close = v => { back.remove(); document.removeEventListener("keydown", onKey, true); try { prev && prev.focus(); } catch (e) {} resolve(v); };
    const onKey = e => {
      if (e.key === "Escape") { e.stopPropagation(); close(o.dismiss); }
      if (e.key === "Enter" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA" && !e.target.closest("button")) { e.preventDefault(); close(buttons[buttons.length - 1].value); }
    };
    document.addEventListener("keydown", onKey, true);
    back.addEventListener("click", e => {
      const b = e.target.closest("[data-dlg]");
      if (b) close(buttons[+b.dataset.dlg].value);
      else if (e.target === back && o.dismiss !== undefined) close(o.dismiss);
    });
    if (o.onMount) o.onMount(back.querySelector(".dlg"), close);
    back.querySelector(".dlg-actions .btn:last-child")?.focus();
  });
}
export const alertBox = (title, message, icon = "ℹ️") =>
  dialog({ title, message, icon, buttons: [{ label: "OK", value: true, kind: "sun" }], dismiss: true });
export const confirmBox = (title, message, { ok = "Confirm", cancel = "Cancel", danger = false, icon } = {}) =>
  dialog({ title, message, icon: icon || (danger ? "⚠️" : "❔"), tone: danger ? "danger" : "",
           buttons: [{ label: cancel, value: false, kind: "light" }, { label: ok, value: true, kind: danger ? "hot" : "sun" }], dismiss: false });

// Copies text; if the browser blocks it, shows the text ready to copy by hand
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) {
    await dialog({
      title: "Copy this link", icon: "🔗", dismiss: true,
      html: `<p>Your browser blocked automatic copying. Select the link and copy it.</p><input class="input" readonly value="${safe(text)}">`,
      buttons: [{ label: "Done", value: true, kind: "sun" }],
      onMount: box => { const i = box.querySelector("input"); i.focus(); i.select(); }
    });
    return false;
  }
}


// ============================================================
// Bidders: team phones ask to bid, the host approves or removes them
// ============================================================
// mountBidders(box, code, () => teams, crestFn, onCount(pending, approved))
export function mountBidders(box, code, getTeams, crestFn, onCount) {
  let members = {}, online = {}, gotMembers = false, gotOnline = false;
  const draw = () => {
    if (!gotMembers || !gotOnline) { box.innerHTML = `<p class="muted">Loading…</p>`; return; }
    const teams = Object.entries(getTeams() || {});
    const all = Object.entries(members);
    const pending = all.filter(([, m]) => !m.approved);
    if (onCount) onCount(pending.length, all.length - pending.length);
    const row = ([uid, m]) => `
      <div class="bidder ${m.approved ? "ok" : "wait"}">
        <span class="dot ${online[uid] ? "on" : ""}" title="${online[uid] ? "Connected now" : "Not connected"}"></span>
        <div class="grow"><b>${safe(m.name || "?")}</b>
          <small>${m.approved ? (online[uid] ? "Approved · connected" : "Approved · not connected") : "Waiting for your approval"}</small></div>
        ${m.approved ? "" : `<button class="btn btn-sun btn-sm" data-bapprove="${uid}">Approve</button>`}
        <button class="btn btn-danger btn-sm" data-bremove="${uid}">${m.approved ? "Remove" : "Reject"}</button>
      </div>`;
    box.innerHTML = `
      ${pending.length > 1 ? `<div class="row" style="justify-content:flex-end;margin-bottom:8px"><button class="btn btn-sun btn-sm" data-bapproveall>Approve all ${pending.length} waiting</button></div>` : ""}
      <div class="bidder-teams">${teams.map(([tid, t]) => {
        const mine = all.filter(([, m]) => m.team === tid).sort((a, b) => (a[1].approved === b[1].approved ? 0 : a[1].approved ? 1 : -1));
        return `<div class="bidder-team" style="--c:${safe(t.color || "#888")}">
          <div class="bidder-team-head">${crestFn(tid, "sm")}<b>${safe(t.name)}</b><span class="muted">${mine.filter(([, m]) => m.approved).length} approved</span></div>
          ${mine.map(row).join("") || `<p class="muted" style="margin:6px 0 0;font-size:14px">No one has asked to bid yet.</p>`}
        </div>`;
      }).join("")}</div>
      <p class="hint">People open their team link, enter their name and ask to bid. Only approved people can bid. If a phone drops out, it reconnects by itself; on a new phone they ask again, and you approve them again (remove the old phone first if they reuse the same name).</p>`;
  };
  const stop1 = onValue(ref(db, `auctionMembers/${code}`), snap => { members = snap.val() || {}; gotMembers = true; draw(); });
  const stop2 = onValue(ref(db, `auctionOnline/${code}`), snap => { online = snap.val() || {}; gotOnline = true; draw(); });
  const onClick = async e => {
    const ap = e.target.closest("[data-bapprove]"), rm = e.target.closest("[data-bremove]"), all = e.target.closest("[data-bapproveall]");
    if (ap) await set(ref(db, `auctionMembers/${code}/${ap.dataset.bapprove}/approved`), true);
    if (all) {
      const ch = {};
      Object.entries(members).forEach(([uid, m]) => { if (!m.approved) ch[`auctionMembers/${code}/${uid}/approved`] = true; });
      await update(ref(db), ch);
    }
    if (rm) {
      const uid = rm.dataset.bremove, m = members[uid] || {};
      const ok = await confirmBox(m.approved ? `Remove ${m.name}?` : `Reject ${m.name}?`,
        m.approved ? "This phone stops bidding right away. Their name is freed, so they can ask again from another phone." : "They won't be able to bid unless they ask again.",
        { ok: m.approved ? "Remove" : "Reject", danger: true });
      if (!ok) return;
      const ch = { [`auctionMembers/${code}/${uid}`]: null, [`auctionOnline/${code}/${uid}`]: null };
      if (m.nameKey) ch[`auctionNames/${code}/${m.nameKey}`] = null;
      await update(ref(db), ch);
    }
  };
  box.addEventListener("click", onClick);
  draw();
  return { stop() { stop1(); stop2(); box.removeEventListener("click", onClick); }, redraw: draw, members: () => members };
}
