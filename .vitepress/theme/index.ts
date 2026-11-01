import DefaultTheme from 'vitepress/theme'
import { defineAsyncComponent } from 'vue'
import type { Theme } from 'vitepress'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/600.css'
import '@fontsource/roboto/700.css'
import '@fontsource/roboto-mono/400.css'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Monaco and the compiler only load on the playground page, in the browser
    app.component(
      'Playground',
      defineAsyncComponent(() => import('./playground/Playground.vue')),
    )
  },
} satisfies Theme
