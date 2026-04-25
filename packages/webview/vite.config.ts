import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig({
  assetsInclude: ['**/*.md?raw'],
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver(),
      // 自动导入图标组件
      IconsResolver({
        prefix: 'Icon',
      }),],
    }),
    Components({
      resolvers: [ElementPlusResolver(),  
      // 自动注册图标组件
      IconsResolver({
        enabledCollections: ['ep'],
      }),],
    }),
    Icons({
      autoInstall: true,
    }),
  ],
  build: {
    outDir: path.resolve(__dirname, "../../dist-web"),
    assetsInlineLimit: 0,
    sourcemap: false,
    cssCodeSplit: false,
    rollupOptions: {
      external: ["vscode"],
      output: {
        inlineDynamicImports: true,
        entryFileNames: "js/app.js",
        assetFileNames: "[ext]/[name].[ext]",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
