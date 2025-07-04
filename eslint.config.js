export default [
  // Base configuration for all files
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      // Basic rules that work without plugins
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "prefer-const": "error",
      "no-console": "off", // Allow console.log for server logging
      "no-var": "error",
      eqeqeq: "error",
      curly: "error",
      "no-undef": "off", // TypeScript handles this
    },
  },

  // Ignore patterns
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "**/*.d.ts",
      "apps/server/src/generated/**",
      "coverage/**",
    ],
  },
];
