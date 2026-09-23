// cypress.config.js
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "m1tyf1",

  e2e: {
    baseUrl: "http://localhost:3000",

    // Mobile portrait (iPhone 12/13/14) - foco principal do projeto
    viewportWidth: 390,
    viewportHeight: 844,

    // Timeouts generosos (o app faz muitas chamadas de API)
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    pageLoadTimeout: 60000,

    // Vídeo e screenshot
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,
    trashAssetsBeforeRuns: true,

    // Retries para lidar com flakiness de rede/API
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // O app usa muitos setTimeout e animações; desabilitar
    // a checagem de segurança de cross-origin ajuda
    chromeWebSecurity: false,

    setupNodeEvents(on, config) {
      return config;
    },
  },
});
