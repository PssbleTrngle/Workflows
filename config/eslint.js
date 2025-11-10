/**
 * @param {string} tsconfigRootDir
 * @returns {import("eslint").Linter.Config}
 */
export function overrides(tsconfigRootDir) {
  return {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
        },
      ],
    },
    languageOptions: {
      parserOptions: {
        tsconfigRootDir,
        project: ["./tsconfig.json"],
      },
    },
  };
}
