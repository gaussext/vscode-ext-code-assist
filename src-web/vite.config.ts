import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig({
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
    outDir: path.resolve(__dirname, "../dist-web"),
    assetsInlineLimit: 0, // 禁用文件名哈希
    sourcemap: false,
    cssCodeSplit: false, // 不生成单独的 CSS 文件
    rollupOptions: {
      external: ["vscode"],
      output: {
        inlineDynamicImports: true, // 强制所有代码打包进一个文件
        entryFileNames: "js/app.js", // 指定输出文件名
        assetFileNames: "[ext]/[name].[ext]", // 静态资源名称（如果有的话）
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
