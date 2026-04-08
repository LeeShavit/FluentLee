# Flash Card App — Project Plan

## Overview

A mobile-first web app for learning Spanish vocabulary. Single user, no auth. Built with React + Vite, backed by AWS Amplify (Lambda + DynamoDB). Features CRUD management of cards organized in groups with tags, a study mode with random flip, and proficiency tracking.

---

## Tech Stack

- **Frontend:** React 18 + Vite, React Router v6, CSS Modules (no UI framework — clean & minimal)
- **Backend:** AWS Amplify Gen 2 (AppSync GraphQL API + DynamoDB)
- **Hosting:** AWS Amplify Hosting
- **Audio:** Browser SpeechSynthesis API (built-in, free)
- **Deployment:** `amplify push` / Git-based CI via Amplify Console

---

## Data Model

### Group
| Field       | Type     | Notes                     |
|-------------|----------|---------------------------|
| id          | String   | UUID, partition key       |
| name        | String   | e.g. "Week 1", "Travel"  |
| createdAt   | String   | ISO timestamp             |

### Card
| Field         | Type     | Notes                                        |
|---------------|----------|----------------------------------------------|
| id            | String   | UUID                                         |
| groupId       | String   | FK → Group                                   |
| word          | String   | Spanish word or phrase                        |
| meaning       | String   | English translation / explanation             |
| example       | String?  | Nullable. Example sentence using the word     |
| significance  | Number   | 1–5 rating of importance                     |
| proficiency   | Enum     | NEW → RECOGNIZED → RECALLED → MASTERED       |
| createdAt     | String   | ISO timestamp                                |

### Tag
| Field | Type   | Notes                          |
|-------|--------|--------------------------------|
| id    | String | UUID                           |
| name  | String | e.g. "verb", "food", "travel"  |

### CardTag (join)
| Field  | Type   |
|--------|--------|
| cardId | String |
| tagId  | String |

---

## Proficiency Statuses

Cards progress through four stages:

| Status         | Meaning                                                        | Icon idea |
|----------------|----------------------------------------------------------------|-----------|
| **New**        | Completely unfamiliar. Never seen or studied.                  | ○○○○      |
| **Recognized** | You understand the word when you see/hear it.                  | ●○○○      |
| **Recalled**   | You can remember the word from its meaning (reverse recall).   | ●●○○      |
| **Mastered**   | Comes to mind effortlessly. Embedded in long-term memory.      | ●●●○      |

Users manually update proficiency from the study screen or card detail view.

---

## Pages & UX

### 1. Home (Group List)
- List of all groups, sorted by most recent
- Each row shows: group name, card count, progress bar (proficiency distribution)
- FAB button: "+ New Group"
- Top: global search bar (searches across all cards by word/meaning)

### 2. Group Detail
- Header: group name, card count, proficiency summary (e.g. "8 New · 5 Recognized · 3 Recalled · 2 Mastered")
- Card list with: word, meaning preview, proficiency badge, tags as chips
- Filter bar: filter by tag, filter by proficiency status
- Actions: "+ Add Card", "Study This Group", "Bulk Import"
- Swipe/long-press card for edit/delete

### 3. Add / Edit Card
- Fields:
  - Group selector (dropdown, defaults to current group; can create new group inline)
  - Word / Phrase (required)
  - Meaning (required)
  - Example sentence (optional)
  - Tags (multi-select chips + inline "create new tag")
  - Significance (1–5 star rating)
  - Proficiency (defaults to NEW for new cards)
- Save button
- Audio preview button (plays pronunciation of the word field)

### 4. Bulk Import
- Accessed from Group Detail
- Textarea input: paste lines in format `word, meaning` or `word | meaning`
- Preview parsed cards before confirming
- All imported cards get proficiency = NEW, significance = 3 (default)
- Tags can be applied in bulk to all imported cards
- Confirm button creates all cards at once

### 5. Study Mode
- Entry points:
  - "Study This Group" from Group Detail (cards in one group)
  - "Study by Tag" from a tag-based study screen (cards across all groups matching selected tags)
- Options before starting:
  - Direction toggle: Spanish → English (default) or English → Spanish (reverse mode)
  - Filter by proficiency (e.g. only NEW + RECOGNIZED)
- Study screen:
  - Shows card front (word or meaning depending on direction)
  - Tap to flip → reveals the other side + example sentence if present
  - Audio button: plays pronunciation of the Spanish word
  - After flip, buttons: "Got it" / "Missed it" (tracked for session stats)
  - Proficiency quick-update: tap current status to advance it
  - Swipe or arrow to next card (random order)
- Session complete screen:
  - Cards reviewed, got-it count, missed count
  - List of missed cards for quick review

### 6. Tag-Based Study
- Screen showing all tags as selectable chips
- Select one or more tags → shows count of matching cards
- "Start Study" button → enters Study Mode with those cards

### 7. Global Search
- Accessible from Home screen top bar
- Searches across word and meaning fields in all cards
- Results show: word, meaning, group name, proficiency badge
- Tap result → navigates to card detail/edit

---

## API Layer (Amplify GraphQL)

### Queries
- `listGroups` — all groups with card counts + proficiency distribution
- `getGroup(id)` — single group with its cards
- `listCards(groupId, tagFilter?, proficiencyFilter?)` — cards with filters
- `searchCards(query)` — full-text search across word + meaning
- `listTags` — all tags

### Mutations
- `createGroup(name)` / `updateGroup(id, name)` / `deleteGroup(id)`
- `createCard(input)` / `updateCard(id, input)` / `deleteCard(id)`
- `bulkCreateCards(groupId, cards[])` — batch import
- `createTag(name)` / `deleteTag(id)`
- `updateCardProficiency(id, proficiency)` — quick status update from study mode

---

## Project Structure

```
flash-card-app/
├── amplify/
│   ├── backend/
│   │   └── data/
│   │       └── resource.ts          # DynamoDB schema + GraphQL definitions
│   ├── auth/                         # (minimal, no auth but Amplify requires config)
│   └── backend.ts
├── src/
│   ├── api/                          # GraphQL query/mutation helpers
│   ├── components/
│   │   ├── CardForm.jsx
│   │   ├── CardItem.jsx
│   │   ├── GroupCard.jsx
│   │   ├── ProficiencyBadge.jsx
│   │   ├── TagChip.jsx
│   │   ├── SearchBar.jsx
│   │   ├── AudioButton.jsx
│   │   ├── StudyCard.jsx
│   │   └── BulkImport.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── GroupDetail.jsx
│   │   ├── CardEdit.jsx
│   │   ├── StudyMode.jsx
│   │   ├── TagStudy.jsx
│   │   └── BulkImportPage.jsx
│   ├── hooks/
│   │   ├── useCards.js
│   │   ├── useGroups.js
│   │   ├── useTags.js
│   │   ├── useAudio.js
│   │   └── useStudySession.js
│   ├── utils/
│   │   ├── proficiency.js            # Status enum, helpers, display labels
│   │   └── bulkParser.js             # Parse pasted text into card objects
│   ├── styles/                       # CSS Modules, mobile-first
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── vite.config.js
└── index.html
```

---

## AWS Setup Guide

### Prerequisites
- AWS account
- Node.js 18+
- npm

### Steps

1. **Install Amplify CLI:**
   ```bash
   npm install -g @aws-amplify/cli
   amplify configure
   ```

2. **Initialize project:**
   ```bash
   npm create vite@latest flash-card-app -- --template react
   cd flash-card-app
   amplify init
   ```

3. **Add API + Database:**
   ```bash
   amplify add api
   # Select GraphQL
   # Choose "API key" for auth (no user auth needed)
   # Define schema (provided in data model above)
   ```

4. **Deploy backend:**
   ```bash
   amplify push
   ```

5. **Enable hosting:**
   ```bash
   amplify add hosting
   # Select Amplify Console (Git-based)
   amplify publish
   ```

### Environment Variables
- `VITE_AMPLIFY_API_ENDPOINT` — auto-configured by Amplify
- `VITE_AMPLIFY_API_KEY` — auto-configured by Amplify
- `VITE_AMPLIFY_REGION` — e.g. `us-east-1`

---

## Implementation Order

1. **Scaffold** — Vite + React + Amplify init + DynamoDB schema
2. **Groups CRUD** — Home page + create/edit/delete groups
3. **Cards CRUD** — Card form + list within group + tags
4. **Search** — Global search across all cards
5. **Proficiency** — Status badges + manual update
6. **Study Mode** — Random flip, reverse mode, session stats
7. **Tag-Based Study** — Cross-group study by tag selection
8. **Bulk Import** — Paste + parse + preview + create
9. **Audio** — SpeechSynthesis integration on cards + study
10. **Polish** — Progress bars, animations, dark mode (stretch), responsive tweaks

---

## Design Principles

- **Mobile-first**: designed for phone screens, usable on desktop
- **Minimal UI**: clean typography, lots of whitespace, no clutter
- **Fast interactions**: optimistic updates, no loading spinners for quick actions
- **Progressive**: start simple (add a group, add a card, study) — advanced features discoverable but not in the way
