import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/Lancelot.js"],
  bundle: true,
  format: "esm",
  outfile: "dist/lancelot-cdn-module.js",
});
