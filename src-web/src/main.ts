import { createApp } from "vue";
import App from "./App.vue";

import "./styles/reset.css";
import "./styles/atom-one-dark.min.css";
import "./styles/vscode.css";
import "./styles/markdown.css";
import 'element-plus/theme-chalk/dark/css-vars.css';
import "element-plus/dist/index.css";
import "./styles/index.css";

const app = createApp(App);
app.mount("#app");
