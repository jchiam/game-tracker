// Builds src/styles/tokens.css from design-tokens.json via the Style Dictionary API.
// The v5 CLI has no --watch flag, so `npm run dev` runs this file under
// `node --watch-path=…`, which re-runs it whenever the token source changes.
import StyleDictionary from 'style-dictionary';
import config from '../style-dictionary.config.mjs';

const sd = new StyleDictionary(config);
await sd.buildAllPlatforms();
