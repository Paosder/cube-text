import esbuild from "esbuild";

esbuild
  .build({
    entryPoints: ["stories/index.ts"],
    bundle: true,
    format: "esm",
    sourcemap: true,
    outfile: "dist/esm/index.js",
    target: "es6",
    minify: true,
    plugins: [],
    loader: {},
    external: ["gl-matrix", "react", "react-dom"],
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

esbuild
  .build({
    entryPoints: ["stories/index.ts"],
    bundle: true,
    format: "cjs",
    sourcemap: true,
    outfile: "dist/cjs/index.js",
    minify: true,
    plugins: [],
    loader: {},
    external: ["gl-matrix", "react", "react-dom"],
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
