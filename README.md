# 📱 Swello Frontend Client

Welcome to the frontend repository for **Swello**, a culturally adapted nutritional mobile application designed for Cameroon. This application is a meal planning and dietary tracking system wrapped in a native mobile shell using **Capacitor**.

It features custom visual representations of localized Cameroonian ingredient measurements ("Estimates"), a proprietary Balanced Level Score (BLS) calculator, and an interactive AI Meal Editor powered by Gemini.

---

## 🎨 Visual Identity & Design System

The app is built upon the **"Forest & Earth"** design system, combining rich natural Cameroonian colors with modern glassmorphism UI elements:
*   **Primary (Forest Canopy)**: `#064E3B` (Dark green)
*   **Secondary (Laterite Red)**: `#B45309` (Earthy orange/brown)
*   **Accent (Vibrant Palm)**: `#F59E0B` (Sunny yellow)
*   **Typography**: Playfair Display (headings), Inter (body text), and Space Grotesk (numbers/data).

---

## 🏗️ Project Architecture

The frontend is a **Vite + React + TypeScript** project styled using **Tailwind CSS**.

```
swello-frontend/
├── assets/            # Global images, icons, and logo assets
├── src/
│   ├── components/    # Modular screen components & dialogs
│   ├── lib/           # SDK wrappers (Supabase configuration, logging)
│   ├── App.tsx        # Main application root and layout manager
│   ├── api.ts         # Authentication-wrapped API communication client
│   ├── types.ts       # TypeScript interfaces mapping model contracts
│   ├── utils.ts       # Formatting, date utilities, and BLS helpers
│   └── index.css      # Core Tailwind CSS and font styles
├── package.json       # Dependencies (React, Lucide, Tailwind, Motion)
└── vite.config.ts     # Vite compilation rules
```

### 📁 Screen Components (`src/components/`)

Below is the purpose and functionality of the 14 core components:

| Component | Description |
|-----------|-------------|
| **`AIEditor.tsx`** | The AI Meal Editor. Users toggle ingredients to add/remove them, submit to Gemini, and view visual additions/deletions with green/red diff styling and AI insights. |
| **`AddRecipeIngredients.tsx`** | Interface for adding custom recipes. Employs a structured form targeting Cameroonian sizes (Small/Medium/Large) and Estimates. |
| **`AddToPlanModal.tsx`** | Dialogue prompt to select target dates (Monday–Sunday) and meal categories (Breakfast, Lunch, Dinner) when scheduling meals. |
| **`Auth.tsx`** | Login and Sign Up screens leveraging Supabase native credentials. |
| **`DiscoveryFeed.tsx`** | Main home dashboard. Displays a 2-column feed of the 15 baseline Cameroonian recipes, featuring duration badges, bookmark states, and search pills. |
| **`MealDetail.tsx`** | Deep-dive screen for recipes. Uses tab switching to toggle between: **Ingredients** (with size adjustments), **Preparation Steps**, and **Cookware**. |
| **`NavBar.tsx`** | Floating glassmorphism tab bar positioned at the bottom of the screen. Handles navigation between Discover, Search, Plan, and Profile. |
| **`NutrientBreakdown.tsx`** | Displays the macronutrient (grams and percentages) and micronutrient breakdowns, using radial progress meters to visualize the Balanced Level Score. |
| **`Onboarding.tsx`** | Interactive onboarding carousel welcoming users and explaining local measurement conversions. |
| **`Plan.tsx`** | Week-at-a-glance planner showing daily scheduled meals, daily nutrition aggregations, and weekly target progress. |
| **`Profile.tsx`** | User metadata setting panel containing calorie preferences, saved dishes, and activity levels. |
| **`Search.tsx`** | Search screen combining text query and pre-categorized ingredient chips (Proteins, Spices, Vegetables) to filter recipes. |
| **`Settings.tsx`** | Access to app configuration, notifications, and logging output. |
| **`YourRecipesList.tsx`** | Section displaying the user's custom created or AI-edited recipes. |

---

## ⚙️ Key Technical Features

1.  **Cultural Measurement Displays ("Estimates")**: Categorized into:
    *   *Anatomical & Sensory*: Pinch, handful, drop.
    *   *Volumetric Household Tools*: Cup, teaspoon, glass.
    *   *Natural/Discrete Units*: Clove, slice.
    *   *Market-Derived Container Units*: Heap, bundle.
2.  **API Wrapper (`api.ts`)**: Automatically requests the current Supabase session JWT token and injects it as an `Authorization` header to FastAPI, alongside the `ngrok-skip-browser-warning` header for development.
3.  **Essential Ingredients Lock**: The frontend UI catches AI validation failures when users attempt to remove structural/essential ingredients from traditional meals (e.g., removing Cassava from *Waterfufu and Eru*).

---

## 🚀 Getting Started (Local Development)

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   A running backend instance (local dev port or Ngrok tunnel)

### 1. Installation
Navigate to the frontend directory:
```bash
cd swello-app/swello-frontend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root of `swello-frontend` (using `.env.example` as a guide):
```env
VITE_SUPABASE_URL="https://your-supabase-url.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 3. Run Web App Locally
```bash
npm run dev
```
The app will launch on `http://localhost:3000`.

---

## 📱 Mobile Native Shell (Capacitor Setup)

Capacitor bridges the React web build to native iOS and Android environments.

### 1. Build Web Assets
```bash
npm run build
```
This generates compiled production assets into the `dist/` directory.

### 2. Synchronize Assets with Native Platforms
```bash
# Installs Capacitor core and CLI if not present
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor configuration
npx cap init Swello com.swello.app --web-dir=dist

# Install iOS and Android platforms
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios

# Sync static build assets into Android and iOS projects
npx cap sync
```

### 3. Open in Mobile IDEs
*   **Android**: Run `npx cap open android` to open the project in **Android Studio**. Build, debug, and run on a virtual emulator or connected Android device.
*   **iOS** (Requires macOS): Run `npx cap open ios` to launch **Xcode**. Set up your signing certificates, and run on an iOS Simulator or physical iPhone.

---

## ☁️ Deployment (Web Hosting)

The frontend is ready to host as a PWA on **Vercel** or **Netlify**:
1.  Connect your Git repository to Vercel.
2.  Set the Framework Preset to **Vite**.
3.  Configure the build command to `npm run build` and output directory to `dist`.
4.  Copy environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) into the Vercel dashboard.
