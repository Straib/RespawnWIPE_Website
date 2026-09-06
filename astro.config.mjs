// @ts-check
import { defineConfig } from 'astro/config';

import icon from 'astro-icon';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://Respawn-WIPE.com',
  base: '/',
  trailingSlash: 'always',
  output: 'server',
  integrations: [icon()],

  adapter: node({
    mode: 'standalone'
  })
});