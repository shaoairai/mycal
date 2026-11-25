# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

mycal is a goal tracking and calendar management web application for setting yearly/monthly goals and tracking daily tasks. It's a vanilla JavaScript SPA with Firebase Realtime Database backend.

## Development

**No build tools required** - This is a pure HTML/CSS/JS application with no package manager or bundler.

**To run locally:**
- Open `index.html` directly in a browser
- Or use any local HTTP server (e.g., `python -m http.server`)

## Tech Stack

- Vanilla JavaScript (ES6 modules)
- Firebase Realtime Database (SDK loaded from CDN)
- Pure CSS3 with CSS custom properties

## Architecture

### File Structure
- `index.html` - Page structure and all modal dialogs
- `app.js` - All application logic (~2200 lines)
- `style.css` - Styling and responsive design
- `train.js` / `train.css` - Training page (see below)
- `sw.js` - Service worker; bump `CACHE_NAME` together with `APP_VERSION` and the `?v=` params in `index.html`

### Firebase Data Structure
```
users/{phoneNumber}/
├── yearlyGoals/         # Yearly goal items
├── {year}-{month}/
│   └── goals/           # Monthly goals
└── {year}-{month}-{day}/
    └── items/           # Daily tasks with completion status
```

### Key Modules in app.js

**Authentication** (lines 145-230): Phone-based login with whitelist stored in Firebase `loginWhitelist/`

**Calendar System** (lines 341-430): Monthly grid view, renders daily items with color coding and completion status

**Daily Items** (lines 564-760): CRUD operations for daily tasks, supports drag-drop reordering and "apply to month" feature

**Goal Management**:
- Yearly goals (lines 1223-1525)
- Monthly goals (lines 1529-1870)
- Both support completion tracking and progress calculation

**Statistics Dashboard** (lines 1988-2230): Grid and chart views showing completion rates across all months

### Training page (added 2026-11-25)

A separate full-screen dark page on top of the calendar: weekly workout plan, weekly progress, weekly auto-increase. Entry is the 💪 button in the header; the last view (calendar or training) is remembered per user in `localStorage`.

- `train.js` - all logic, its own ES module; reuses the Firebase app from `app.js` via `getApp()`. `app.js` only sets `window.mycalUser` and fires `mycal:login` / `mycal:logout`.
- `train.css` - styles, all scoped under `.train-page`.
- Markup is the `#trainPage` block at the end of `index.html`.

Screen: week card (ring = done/total, one dot per weekday, 🔥 = weeks in a row fully done), chips for last week's result, then one card per exercise (icon, target, a round pill per scheduled day, `⬆ n` = next week's target, lit once the week is fully done; 🏁 = at cap). The big circle marks today done; a red pill is a missed day and can be tapped to make it up. Tapping the left part of a card edits it; `＋` in the header adds one.

Data lives under `users/{phone}/train/`:
```
exercises/{id}   { icon, name, unit, days, reps, sets, step, cap, since, order }   # days: "024", 0=Mon..6=Sun
log/{YYYY-MM-DD}/{exId}   { name, unit, reps, sets, late, ts }
weeks/{monday}   { done, total, clear, ups }                                     # written when a week is settled
meta/week        monday of the week settled up to
```

Rules:
- UI is icon-first: as little text as possible, numbers and icons instead of labels (user request, 2026-11-25).
- No XP / levels / ranks for now (removed the same day at the user's request); do not add them back unless asked.
- Week starts Monday (the calendar's week goals start Sunday; the two are independent).
- Weekly settlement runs in a transaction the first time the page loads in a new week: an exercise whose scheduled days were all done gets `reps += step` (capped by `cap`); otherwise it stays.
- Missed days can be made up later in the same week; a missed day does not reset anything.
- No names or artwork from Solo Leveling anywhere.

Testing: the database rejects writes outside whitelisted phone numbers, so browser tests have to run against a real user's `train` node; check it is empty first and delete it afterwards.

### Color System
Items support 8 colors: blue, red, orange, yellow, cyan, purple, pink, gray (default: blue)

### Key Features
- Drag-drop reordering within and between days
- "Apply to month" - adds an item to all remaining days
- Real-time sync via Firebase `onValue` listeners
- Progress rate calculation per month
- Multi-user statistics view

## Code Conventions

- All Firebase operations are async functions
- DOM elements are cached in global variables at module top
- Date keys follow format: `{year}-{month}-{day}` (month is 0-indexed)
- Items have structure: `{ id, text, completed, color, order }`
