// @ts-check
import { defineConfig } from 'astro/config';

import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://Respawn-WIPE.com',
  base: '/',
  trailingSlash: 'always',
  integrations: [icon()]
});