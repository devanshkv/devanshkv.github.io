import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://devanshkv.github.io',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  redirects: {
    '/page/1/': '/',
    ...Object.fromEntries([
      '/categories/',
      '/categories/autoencoders/',
      '/categories/autoencoders/page/1/',
      '/categories/keras/',
      '/categories/keras/page/1/',
      '/categories/neural-networks/',
      '/categories/neural-networks/page/1/',
      '/categories/tensorflow/',
      '/categories/tensorflow/page/1/',
      '/tags/',
      '/tags/weekends/',
      '/tags/weekends/page/1/',
    ].map(route => [route, '/publications/'])),
  },
});
