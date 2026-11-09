import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitepress'

// Published as a GitHub Pages project site: https://stirphp.github.io/docs/
// With a custom domain, build with BASE_PATH=/
const base = process.env.BASE_PATH ?? '/docs/'

// The browser language server, from `npm run web`. Without it the site still builds, and the
// editor page says it's missing.
const web = fileURLToPath(new URL('../.stirphp-web/index.js', import.meta.url))
const webMissing = fileURLToPath(new URL('./theme/editor/web-missing.ts', import.meta.url))
if (!existsSync(web)) {
  console.warn('.stirphp-web/ is missing: the editor page will say so. Build it with `npm run web`.')
}

export default defineConfig({
  title: 'StirPHP',
  description: 'A language server and type checker for PHP.',
  base,
  // not pages of the site: the repository's README, and the example projects
  srcExclude: ['README.md', 'core/**', 'examples/**', 'samples/**', 'guide/parts/**'],
  cleanUrls: false,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}logo.svg` }],
    ['meta', { name: 'theme-color', content: '#ce0049' }],
  ],
  vite: {
    plugins: [monacoCssAtRuntime()],
    resolve: {
      alias: {
        'stirphp-web': existsSync(web) ? web : webMissing,
        // only for browsers, which the server-side build of the pages doesn't count as
        'vscode-languageserver-protocol/browser': fileURLToPath(
          new URL('../node_modules/vscode-languageserver-protocol/lib/browser/main.js', import.meta.url),
        ),
        'vscode-jsonrpc/browser': fileURLToPath(new URL('../node_modules/vscode-jsonrpc/lib/browser/main.js', import.meta.url)),
      },
    },
    // Monaco is large; it only loads on the editor page
    build: { chunkSizeWarningLimit: 4096 },
    worker: { format: 'es' },
  },
  markdown: {
    theme: { light: 'github-light', dark: 'github-dark' },
    // Shiki has neither; these are close
    languageAlias: { neon: 'yaml', rhai: 'rust' },
  },
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'StirPHP',
    nav: [
      { text: 'Guide', link: '/guide/', activeMatch: '^/guide/' },
      { text: 'Diagnostics', link: '/reference/diagnostics', activeMatch: '^/reference/' },
      { text: 'Editor', link: '/editor' },
    ],
    sidebar: {
      '/guide/': sidebar(),
      '/reference/': sidebar(),
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/StirPHP/core' }],
    search: { provider: 'local' },
    outline: { level: [2, 3], label: 'On this page' },
    editLink: {
      pattern: 'https://github.com/StirPHP/docs/edit/main/:path',
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'StirPHP is open source under the MIT license.',
      copyright: 'A language server and type checker for PHP.',
    },
  },
})

function sidebar() {
  return [
    {
      text: 'Getting started',
      items: [
        { text: 'What StirPHP is', link: '/guide/' },
        { text: 'Installation', link: '/guide/installation' },
        { text: 'Quick start', link: '/guide/quick-start' },
      ],
    },
    {
      text: 'Using it',
      items: [
        { text: 'Command line', link: '/guide/cli' },
        { text: 'Configuration', link: '/guide/configuration' },
        { text: 'Levels and ignoring', link: '/guide/levels' },
        { text: 'Baselines', link: '/guide/baselines' },
        { text: 'PHP versions', link: '/guide/php-versions' },
        { text: 'Composer', link: '/guide/composer' },
      ],
    },
    {
      text: 'PHPStan',
      items: [
        { text: 'Compatibility', link: '/guide/phpstan' },
        { text: 'Running PHPStan alongside', link: '/guide/running-phpstan' },
      ],
    },
    {
      text: 'Frameworks and rules',
      items: [
        { text: 'Frameworks', link: '/guide/frameworks' },
        { text: 'Blade', link: '/guide/blade' },
        { text: 'Rules and hooks', link: '/guide/rules' },
      ],
    },
    {
      text: 'Editors',
      items: [
        { text: 'Editor setup', link: '/guide/editors' },
        { text: 'Code actions', link: '/guide/code-actions' },
        { text: 'Formatter', link: '/guide/formatter' },
        { text: 'In the browser', link: '/guide/browser' },
      ],
    },
    {
      text: 'Reference',
      items: [{ text: 'Diagnostics', link: '/reference/diagnostics' }],
    },
  ]
}

/**
 * Monaco's stylesheets, added to the page by its own code when it loads, instead of in the site's
 * one stylesheet, where VitePress puts every page's CSS: so pages without the editor don't
 * download them.
 */
function monacoCssAtRuntime(): Plugin {
  const prefix = '\0monaco-css:'
  return {
    name: 'stirphp:monaco-css-at-runtime',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!source.endsWith('.css') || !importer?.includes('/node_modules/monaco-editor/')) return null
      const resolved = await this.resolve(source, importer, { skipSelf: true })
      return resolved ? `${prefix}${resolved.id}.js` : null
    },
    load(id) {
      if (!id.startsWith(prefix)) return null
      const file = id.slice(prefix.length, -'.js'.length)
      const css = readFileSync(file, 'utf8')
      // relative `url(..)`s, such as the icons' font, are assets of the build
      const imports: string[] = []
      const text: string[] = []
      let last = 0
      for (const m of css.matchAll(/url\((['"]?)(\.{1,2}\/[^'")]+)\1\)/g)) {
        const name = `asset${imports.length}`
        imports.push(`import ${name} from ${JSON.stringify(resolve(dirname(file), m[2]) + '?url')}`)
        text.push(JSON.stringify(css.slice(last, m.index) + 'url("'), name, JSON.stringify('")'))
        last = m.index + m[0].length
      }
      text.push(JSON.stringify(css.slice(last)))
      return [
        ...imports,
        "const style = document.createElement('style')",
        `style.dataset.monaco = ${JSON.stringify(file.split('/node_modules/').pop())}`,
        `style.textContent = ${text.join(' + ')}`,
        'document.head.append(style)',
      ].join('\n')
    },
  }
}
