import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    // Note: This can be dynamically overridden in CI/CD by setting the CYPRESS_BASE_URL environment variable.
    baseUrl: "http://localhost:5173",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});