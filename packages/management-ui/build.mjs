import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "iife",
  globalName: "Comment0rAdmin",
  outfile: "../../static/assets/comment0r-admin.bundle.js",
  platform: "browser",
  target: ["es2020"],
  sourcemap: true,
  minify: false
});
