import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

import './styles/reset.css';
// vscode
import './styles/theme.css'
import './styles/vscode.css';
// markdown
import './styles/markdown.css';
// lib
import 'element-plus/theme-chalk/dark/css-vars.css';
import 'element-plus/dist/index.css';
// app
import './styles/index.css';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.mount('#app');

window.addEventListener('load', () => {
  if (globalThis.acquireVsCodeApi) {
    document.documentElement.classList.add('vscode');
  } else {
    document.documentElement.classList.add('browser');
  }
});
