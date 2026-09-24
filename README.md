# AtlasRoute — Material UI Trip Readiness

AtlasRoute HW11 continues the existing travel SPA and integrates **Material UI** into a real product flow instead of building a separate demo screen.

The main addition is **Trip Readiness**: a checklist attached to each saved trip. It tracks trip-level preparation and traveler-specific checks, keeps progress per trip, and works together with the existing planner, Redux state and local persistence.

## Homework Focus

Material UI is used as part of the existing AtlasRoute interface and adapted to the project’s visual system for both Light and Dark themes.

The HW11 flow covers:

```text
Country Details
      ↓
Trip Readiness
      ↓
Saved trip / traveler progress
      ↓
My Atlas
      ↓
Readiness modal + filters + sorting
```

The implementation keeps the existing AtlasRoute layout and styles intact. MUI is scoped to the new functionality through a dedicated `ThemeProvider`; no global `CssBaseline` reset is used.

## Material UI Integration

The project uses Material UI components where they add practical UI behavior:

- `ThemeProvider` and `createTheme` for AtlasRoute Light/Dark integration;
- `Accordion`, `AccordionSummary` and `AccordionDetails` for additional travelers;
- `Dialog`, `DialogContent` and `IconButton` for the readiness modal;
- `Checkbox` for readiness tasks;
- `LinearProgress` for trip and traveler progress;
- `Chip` for readiness and contextual country states;
- `ToggleButtonGroup` for All / Upcoming / Past trip filters;
- `Select` and `MenuItem` for readiness filters and sorting;
- `Button`, `Stack`, `Typography`, `Box` and `Alert` inside the readiness UI.

The components are styled to match the existing AtlasRoute spacing, typography, borders and responsive behavior.

## Trip Readiness

Each saved trip has its own readiness state. Trips to the same country do not share progress.

Readiness includes six trip-level checks:

- travel dates;
- accommodation;
- budget and payment readiness;
- transport / arrival plan;
- places / itinerary;
- packing list.

Each traveler also has three personal checks:

- passport / travel document;
- entry requirements;
- travel insurance.

The checklist supports these states:

- **Not started** — no readiness action has been taken;
- **Needs attention** — at least one critical check is still open;
- **In progress** — critical checks are complete, but recommended checks remain;
- **Ready** — all critical and recommended checks are complete;
- **Complete** — every check, including optional items, is complete.

Optional items do not block the `Ready` state. A fully completed checklist shows the success state and animation.

## Traveler Roster

The planner now starts with **1 traveler** by default and supports up to 10 travelers.

The primary traveler keeps the full contact form. Additional travelers use compact MUI accordions with:

- required full name;
- optional email with validation;
- stable traveler IDs so readiness progress stays attached to the correct person after edits.

Additional travelers can be removed individually. Reducing the traveler count or removing a saved traveler uses a confirmation dialog before their data and readiness progress are discarded.

## Saved Trip Plans

`My Atlas` includes trip filtering and sorting:

- All / Upcoming / Past;
- readiness status;
- Recently updated;
- Recently added;
- trip date — soonest / latest;
- destination — A to Z / Z to A.

When a country has several saved trips, the Country Details page opens `My Atlas` with that country already selected. The contextual country chip can be removed without resetting the other filters.

## Date Handling

Date-only values for `<input type="date">` are generated from **local calendar fields** instead of `toISOString()` UTC slicing. This avoids the UTC+ timezone issue where a local date near midnight can become the previous calendar day.

The project also keeps timestamp fields such as `createdAt` and `updatedAt` in ISO UTC format, where UTC timestamps are appropriate.

## State and Persistence

Saved trips and readiness data are stored in Redux Toolkit and persisted to browser `localStorage`.

The normalization layer keeps backward compatibility with older AtlasRoute trip plans that do not yet contain:

- readiness state;
- traveler roster data;
- stable traveler IDs.

No backend or authentication is required for this homework. Traveler information stays in browser storage and is not sent to AtlasRoute.

## Relevant Routes

| Route | Purpose |
| --- | --- |
| `/countries/:code` | Country details and Trip Readiness |
| `/countries/:code/plan` | Create or edit a trip plan |
| `/saved?tab=trips` | View all saved trip plans |
| `/saved?tab=trips&country=AUS` | View saved trips for a selected country |
| `/saved/trips/:planId` | View one saved trip plan |

## Project Structure

```text
src/
├── components/
│   └── trip/
│       ├── AtlasMuiProvider.jsx
│       ├── TripReadinessPanel.jsx
│       ├── TripReadinessModal.jsx
│       ├── ReadinessTaskRow.jsx
│       ├── TravelerReadinessMatrix.jsx
│       ├── TravelerDetailsForm.jsx
│       ├── TravelerReductionModal.jsx
│       └── SavedTripPlans.jsx
├── pages/
│   ├── CountryDetailsPage.jsx
│   ├── SavedCountriesPage.jsx
│   └── TripPlannerPage.jsx
├── redux/
│   └── tripPlansSlice.js
├── utils/
│   ├── dateInput.js
│   ├── savedTripFilters.js
│   ├── tripPlan.js
│   └── tripReadiness.js
└── validation/
    └── tripPlanSchema.js

test/
├── date-input.test.js
├── saved-trip-filters.test.js
├── trip-plans.test.js
└── trip-readiness.test.js
```

## Technologies

- React 19
- Vite 7
- Material UI
- Emotion
- Redux Toolkit
- React Redux
- React Router
- Formik + Yup
- React Hook Form
- Lottie React
- JavaScript / JSX
- CSS
- Node.js built-in test runner

## Installation and Local Run

```bash
git clone https://github.com/andrii-dolzhenko/react-homework-11-material-ui-atlasroute
cd react-homework-11-material-ui-atlasroute
npm install
```

Optional Pixabay photography can be enabled with a local environment file:

```bash
cp .env.example .env.local
```

Add your own `VITE_PIXABAY_API_KEY` to `.env.local`, then start the project:

```bash
npm run dev
```

The application remains usable without a Pixabay key and falls back to the existing country visuals where photography is unavailable.

## Available Scripts

```bash
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

## Validation Before Submission

```bash
npm run lint
npm test
npm run build
```

Manual QA covers:

- Light and Dark themes;
- desktop, tablet and mobile layouts;
- one and multiple saved trips for the same country;
- 1–10 travelers;
- traveler validation and removal;
- independent readiness state per trip;
- Not started / Needs attention / In progress / Ready / Complete states;
- saved-trip filtering and sorting;
- local persistence after browser reload;
- keyboard and modal close behavior.

## Links

- **Repository:** https://github.com/andrii-dolzhenko/react-homework-11-material-ui-atlasroute
- **Vercel:** https://react-homework-11-material-ui-atlas.vercel.app/
- **GitHub Pages:** https://andrii-dolzhenko.github.io/react-homework-11-material-ui-atlasroute

The project is deployed to both Vercel and GitHub Pages.

---

© 2026 Andrii Dolzhenko. All Rights Reserved.
