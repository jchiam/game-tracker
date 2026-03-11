# Honkai Star Rail Tracker - Boilerplate

A modern, fast, and beautifully designed web application boilerplate to track character upgrades and trace materials in Honkai Star Rail.

## Tech Stack Choices

Here is a breakdown of the chosen technologies:

1. **Vite**: Chosen for its incredibly fast hot module replacement (HMR) and optimized build process. It provides a significantly better developer experience compared to traditional bundlers like Webpack, making local verifications instant.
2. **React (with TypeScript)**: A robust framework for building interactive user interfaces. TypeScript adds strong typing, which is crucial for managing complex game data structures (like characters, paths, elements, and materials) without runtime errors.
3. **Vanilla CSS**: Used for styling to provide maximum flexibility and control over the custom, rich aesthetic required for this project. The design system leverages CSS variables and modern layout techniques to create a premium, dark-mode, neon-accented UI that matches the Honkai Star Rail universe.
4. **Vercel**: The project includes a `vercel.json` configuration for Single Page Application (SPA) routing. Vercel is the optimal deployment platform for Vite/React apps due to its zero-configuration deployments, edge caching, and seamless continuous integration.

## Getting Started

To run the project locally:

```bash
# Install dependencies
npm install

# Start the local Vite dev server
npm run dev
```

## Deployment

This project is readily deployable to Vercel. You can either import it directly via the Vercel dashboard or use the Vercel CLI:

```bash
npm i -g vercel
vercel
```
