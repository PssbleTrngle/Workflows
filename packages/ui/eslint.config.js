// @ts-check
import js from "@eslint/js";
import { overrides } from "@pssbletrngle/workflows-configs/eslint";
import astro from "eslint-plugin-astro";
import { defineConfig } from "eslint/config";
import ts from "typescript-eslint";

export default defineConfig([
  js.configs.recommended,
  ts.configs.recommended,
  ...astro.configs.recommended,
  overrides(import.meta.dirname),
]);
