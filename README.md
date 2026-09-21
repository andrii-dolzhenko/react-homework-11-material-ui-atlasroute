# AtlasRoute — Forms & Validation Travel Planner

AtlasRoute HW10 extends the existing travel SPA with a validated **Trip Planner**. The homework focuses on practical form handling with **Formik + Yup** and **React Hook Form**, including inline validation, error states, successful submit handling, and local persistence of saved trip plans.

## Homework Focus

The Trip Planner is implemented as one two-step product flow with two separate form-state and validation approaches:

```text
Country Details
      ↓
Trip Planner
      ↓
Step 1 — Trip basics (Formik + Yup)
      ↓
Step 2 — Traveler details (React Hook Form)
      ↓
Validated trip plan
      ↓
Redux Toolkit + localStorage
      ↓
Saved Trip Plans
```

Each form owns its own form state and validation logic. The validated result of Step 1 is passed to Step 2 as trip-planning data, while React Hook Form manages the traveler form independently.

## Step 1 — Formik + Yup

`TripBasicsForm` uses **Formik** for form state and **Yup** for schema validation.

Validated fields:

- departure date — required and cannot be in the past;
- return date — required and must be after the departure date;
- travelers — integer from `1` to `10`;
- total budget — required, minimum `500`, maximum `100,000,000`;
- home currency — required;
- trip style — at least one option, maximum five;
- preferred regions/cities — optional, maximum 160 characters;
- notes — optional, maximum 500 characters.

The selected country is inherited from the Country Details route and displayed as a locked destination.

Formik validation is connected through `validationSchema`. Invalid fields receive visual error states with `aria-invalid`, and `ErrorMessage` renders the validation message next to the corresponding field.

## Step 2 — React Hook Form

`TravelerDetailsForm` uses **React Hook Form** with `mode: 'onBlur'`.

Validated fields:

- full name — required, 2–50 characters;
- email — required and validated by email pattern;
- phone — optional, validated by phone pattern when provided;
- departure city — required, 2–80 characters.

The implementation demonstrates:

- `useForm`;
- `register`;
- `handleSubmit`;
- `formState.errors`;
- `isSubmitting`;
- built-in validation rules;
- pattern and custom validation;
- `reset` when editing an existing plan.

Validation messages are displayed directly below the related fields, and invalid controls expose `aria-invalid`.

## Submit and Data Flow

Step 1 continues only after successful Yup validation. Step 2 is submitted through React Hook Form's `handleSubmit` and saves the completed plan only after its validation succeeds.

The final plan is stored in the `tripPlans` Redux Toolkit slice and persisted in browser `localStorage` through the existing Redux persistence layer.

Saved plans support:

- create;
- edit;
- view details;
- delete one plan;
- clear all plans;
- duplicate country/date detection.

No backend or authentication is required for the homework flow. Traveler details remain in browser storage and are not sent to AtlasRoute.

## Relevant Routes

| Route | Purpose |
| --- | --- |
| `/countries/:code` | Select a country and open the planning flow |
| `/countries/:code/plan` | Create or edit a validated trip plan |
| `/saved?tab=trips` | View saved trip plans |
| `/saved/trips/:planId` | View a saved trip plan |

## Relevant Project Structure

```text
src/
├── components/
│   └── trip/
│       ├── TripBasicsForm.jsx
│       ├── TravelerDetailsForm.jsx
│       ├── SavedTripPlans.jsx
│       └── TripPlanSuccessModal.jsx
├── pages/
│   ├── TripPlannerPage.jsx
│   └── TripPlanDetailsPage.jsx
├── redux/
│   └── tripPlansSlice.js
├── validation/
│   └── tripPlanSchema.js
└── utils/
    └── tripPlan.js

test/
└── trip-plans.test.js
```

## Technologies Used for HW10

- React 19
- Vite 7
- Formik
- Yup
- React Hook Form
- Redux Toolkit
- React Redux
- React Router 7
- JavaScript / JSX
- CSS
- Node.js built-in test runner

## Installation and Local Run

```bash
git clone https://github.com/andrii-dolzhenko/react-homework-10-forms-validation-atlasroute.git
cd react-homework-10-forms-validation-atlasroute
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

The application remains usable without a Pixabay key and falls back to country flags where photography is unavailable.

## Available Scripts

```bash
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

## Validation Checklist

Before deployment:

```bash
npm run lint
npm test
npm run build
```

Manual homework QA:

- submit Step 1 with empty/invalid values and verify Yup errors;
- verify the return date cannot be earlier than or equal to the departure date;
- verify travelers, budget, trip-style and text-length rules;
- submit valid Step 1 data and continue to Step 2;
- verify React Hook Form name, email, phone and departure-city validation;
- verify errors appear next to the corresponding fields;
- create a valid trip plan;
- edit an existing trip plan;
- verify saved-plan persistence after browser reload;
- verify the planner on desktop, tablet and mobile layouts;
- verify Light/Dark theme and keyboard/focus states.

## Deployment

The repository is configured for **GitHub Pages** and **Vercel**.

- GitHub Pages deploys from `main` through `.github/workflows/deploy-pages.yml`.
- Vercel uses `vercel.json` to preserve SPA routing on direct route reloads.
- Final live demo links will be added after the submission Pull Request is merged and the production deployments are verified.

---

© 2026 Andrii Dolzhenko. All Rights Reserved.
