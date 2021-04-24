import esbuild from "esbuild";
import { glslify } from "esbuild-plugin-glslify";

esbuild
  .build({
    entryPoints: ["src/cube-text/index.ts"],
    bundle: true,
    format: "esm",
    sourcemap: true,
    outfile: "dist/esm/index.js",
    target: "es2020",
    plugins: [
      glslify({
        compress: true,
        transform: ["glslify-import"],
      }),
    ],
    loader: {},
    external: [],
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

esbuild
  .build({
    entryPoints: ["src/cube-text/index.ts"],
    bundle: true,
    format: "cjs",
    sourcemap: true,
    outfile: "dist/cjs/index.js",
    target: "es6",
    plugins: [
      glslify({
        compress: true,
        transform: ["glslify-import"],
      }),
    ],
    loader: {},
    external: [],
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
