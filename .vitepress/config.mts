import { defineConfig } from 'vitepress'
import sphp from './sphp.tmLanguage.json' with { type: 'json' }

// Published as a GitHub Pages project site: https://stirphp.github.io/docs/
// With a custom domain, build with BASE_PATH=/
const base = process.env.BASE_PATH ?? '/docs/'

export default defineConfig({
  title: 'StirPHP',
  description: 'A strictly typed superset of PHP that compiles to plain PHP.',
  base,
  cleanUrls: false,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}logo.svg` }],
    ['meta', { name: 'theme-color', content: '#ce0049' }],
  ],
  vite: {
    // Monaco is large; it only loads on the playground page
    build: { chunkSizeWarningLimit: 4096 },
    worker: { format: 'es' },
  },
  markdown: {
    theme: { light: 'github-light', dark: 'github-dark' },
    languages: [{ ...sphp, name: 'sphp', aliases: ['stirphp'] } as any],
  },
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'StirPHP',
    nav: [
      { text: 'Guide', link: '/guide/', activeMatch: '^/guide/((index|installation|first-project)(\\.html)?)?$' },
      { text: 'Language', link: '/guide/bindings', activeMatch: '^/guide/(bindings|types|functions|classes|records|control-flow|generics|extensions|php-interop)' },
      { text: 'Tooling', link: '/guide/cli', activeMatch: '^/guide/(cli|configuration|editors|output)' },
      { text: 'Reference', link: '/guide/diagnostics' },
      { text: 'Playground', link: '/playground' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Your first project', link: '/guide/first-project' },
          ],
        },
        {
          text: 'Language',
          items: [
            { text: 'Values and variables', link: '/guide/bindings' },
            { text: 'Types and null safety', link: '/guide/types' },
            { text: 'Functions and lambdas', link: '/guide/functions' },
            { text: 'Classes and data classes', link: '/guide/classes' },
            { text: 'Records', link: '/guide/records' },
            { text: 'when, is and smart casts', link: '/guide/control-flow' },
            { text: 'Generics', link: '/guide/generics' },
            { text: 'Extensions and the stdlib', link: '/guide/extensions' },
            { text: 'Working with PHP', link: '/guide/php-interop' },
          ],
        },
        {
          text: 'Tooling',
          items: [
            { text: 'Command line', link: '/guide/cli' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Editor support', link: '/guide/editors' },
            { text: 'The generated PHP', link: '/guide/output' },
          ],
        },
        {
          text: 'Reference',
          items: [{ text: 'Diagnostics', link: '/guide/diagnostics' }],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/StirPHP/core' }],
    search: { provider: 'local' },
    outline: { level: [2, 3], label: 'On this page' },
    editLink: {
      pattern: 'https://github.com/StirPHP/docs/edit/main/:path',
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'StirPHP is open source under MIT or Apache-2.0.',
      copyright: 'Compiles to plain PHP 8.4.',
    },
  },
})
