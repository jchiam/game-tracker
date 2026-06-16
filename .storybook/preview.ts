import type { Preview } from '@storybook/react-vite';

import '../src/styles/tokens.css';
import '../src/styles/animations.css';
import '../src/styles/card.css';
import '../src/styles/controls.css';
import '../src/index.css';
import '../src/App.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0a0f' },
        { name: 'surface', value: 'rgba(25,25,35,0.95)' },
      ],
    },
  },
};

export default preview;
