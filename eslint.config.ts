import { getEslintConfig } from "eslint-config-setup";

const config = await getEslintConfig({ node: true, oxlint: true });

config.unshift({
  ignores: [
    "**/dist/**",
    "coverage/**",
    "node_modules/**",
    "pnpm-lock.yaml",
    "**/*.json",
    "**/*.md",
  ],
});

// Package-consumer tests operate in temporary directories with generated paths.
config.push({
  files: ["test/**/*.mjs", "scripts/**/*.mjs"],
  rules: { "security/detect-non-literal-fs-filename": "off" },
});

// Scenario tests keep setup, action and assertions together for readability.
config.push({
  files: ["test/**/*.mjs"],
  rules: {
    "max-statements": "off",
    "max-lines-per-function": "off",
    "sonarjs/cognitive-complexity": "off",
  },
});

export default config;
