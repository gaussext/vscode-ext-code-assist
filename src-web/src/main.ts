import { createApp } from "vue";
import { ElButton, ElOption, ElSelect } from "element-plus";
import App from "./App.vue";

import "./styles/reset.css";
import "./styles/atom-one-dark.min.css";
import "./styles/vscode.css";
import "./styles/markdown.css";
import 'element-plus/theme-chalk/dark/css-vars.css';
import "element-plus/dist/index.css";
import "./styles/index.css";

import * as ElementPlusIconsVue from '@element-plus/icons-vue';
const app = createApp(App);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
   app.component(key, component);
}

app.use(ElButton);
app.use(ElSelect);
app.use(ElOption);
app.mount("#app");
