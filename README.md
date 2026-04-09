# Game Progress Tracker

[![CI](https://github.com/jchiam/game-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/jchiam/game-tracker/actions/workflows/ci.yml)
[![CodeQL](https://github.com/jchiam/game-tracker/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/jchiam/game-tracker/actions/workflows/github-code-scanning/codeql)
[![Dependabot Updates](https://github.com/jchiam/game-tracker/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/jchiam/game-tracker/actions/workflows/dependabot/dependabot-updates)
[![codecov](https://codecov.io/gh/jchiam/game-tracker/graph/badge.svg?token=T7Q2FAR138)](https://codecov.io/gh/jchiam/game-tracker)

[![Update HSR Data](https://github.com/jchiam/game-tracker/actions/workflows/update-hsr-data.yml/badge.svg)](https://github.com/jchiam/game-tracker/actions/workflows/update-hsr-data.yml)
[![Update R1999 Data](https://github.com/jchiam/game-tracker/actions/workflows/update-r1999-data.yml/badge.svg)](https://github.com/jchiam/game-tracker/actions/workflows/update-r1999-data.yml)

A modern, fast, and beautifully designed web application to track my progress in various games.

## Tech Stack Choices

Here is a breakdown of the chosen technologies:

1. **Vite**: Chosen for its incredibly fast hot module replacement (HMR) and optimized build process. It provides a significantly better developer experience compared to traditional bundlers like Webpack, making local verifications instant.
2. **React (with TypeScript)**: A robust framework for building interactive user interfaces. TypeScript adds strong typing, which is crucial for managing complex game data structures (like characters, paths, elements, and materials) without runtime errors.
3. **Vanilla CSS**: Used for styling to provide maximum flexibility and control over the custom, rich aesthetic required for this project. The design system leverages CSS variables and modern layout techniques to create a premium, dark-mode, neon-accented UI that matches the Honkai Star Rail universe.
4. **Vercel**: The project includes a `vercel.json` configuration for Single Page Application (SPA) routing. Vercel is the optimal deployment platform for Vite/React apps due to its zero-configuration deployments, edge caching, and seamless continuous integration.

## Getting Started

To run the project locally:

1. Create a `.env.local` file at the root of the project with your Supabase credentials to enable the persistent database (you must create a Supabase project first):

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Link your local codebase to your remote Supabase project and push the initial database schema:

```bash
# Login to Supabase CLI (this will open a browser window)
npx supabase login

# Link this folder to your Supabase project (find the ID in your Supabase project URL dashboard)
npm run db:link -- --project-ref your_project_id

# Push the migration schema up to your remote database
npm run db:push
```

3. Install and run frontend:

```bash
# Install dependencies
npm install

# Start the local Vite dev server
npm run dev
```

## Testing

Unit tests run using Vitest.
To run the tests manually, use:

```bash
npm run test
```

Tests will automatically run via a Husky `pre-push` hook before your commits are pushed to the repository.

## Deployment

This project is readily deployable to Vercel. You can either import it directly via the Vercel dashboard or use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

**Important Deployment Step for Vercel:**
When setting up the project on Vercel, you must configure the exact same Environment Variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) in the Vercel dashboard settings under the project's **Environment Variables** tab so that the production build can communicate with your Supabase Postgres database.

## Wiki

This project has a [GitHub Wiki](https://github.com/jchiam/game-tracker/wiki) with detailed documentation on game tracker features, data architecture, and development setup.

The wiki is managed as a git submodule in the `wiki/` directory.

### Working with the Wiki

**Initial Setup (First Time Only):**

```bash
# Initialize and clone the wiki submodule
git submodule update --init --recursive
```

**Editing the Wiki:**

```bash
# Navigate to the wiki directory
cd wiki

# Make your changes to the markdown files
# ...

# Commit and push changes
git add .
git commit -m "Update wiki pages"
git push
```

**Pulling Wiki Updates:**

```bash
# Pull latest wiki changes along with the main repo
git pull --recurse-submodules
```

**Cloning the Repo with Wiki:**

```bash
# Clone the repo with the wiki submodule already initialized
git clone --recurse-submodules https://github.com/jchiam/game-tracker.git
```
