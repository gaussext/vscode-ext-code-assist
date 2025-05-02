const { defineConfig } = require('@vue/cli-service');
const path = require('path');

module.exports = defineConfig({
  transpileDependencies: true,
  filenameHashing: false,
  outputDir: path.resolve(__dirname, "../dist-web"),
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, "src"),
      }
    },
    externals: {
      vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded
      // modules added here also need to be added in the .vscodeignore file
    }
  }
})