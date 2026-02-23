import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "iife",
  globalName: "Comment0r",
  outfile: "../../static/assets/comment0r.bundle.js",
  platform: "browser",
  target: ["es2020"],
  sourcemap: true,
  minify: false
});
