import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
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
