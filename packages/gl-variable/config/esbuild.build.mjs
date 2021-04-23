import esbuild from "esbuild";
import { glslify } from "esbuild-plugin-glslify";

esbuild
  .build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    format: "esm",
    sourcemap: true,
    outfile: "dist/esm/index.js",
    target: "es2020",
    minify: true,
    plugins: [
      glslify({
        compress: true,
        transform: ["glslify-import"],
      }),
    ],
    loader: {},
    external: ["gl-matrix", "@paosder/*"],
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

esbuild
  .build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    format: "cjs",
    sourcemap: true,
    outfile: "dist/cjs/index.js",
    minify: true,
    plugins: [
      glslify({
        compress: true,
        transform: ["glslify-import"],
      }),
    ],
    loader: {},
    external: ["gl-matrix", "@paosder/*"],
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
