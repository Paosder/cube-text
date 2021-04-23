import esbuild from "esbuild";
import { glslify } from "esbuild-plugin-glslify";
import { exec } from "child_process";

esbuild
  .build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    format: "cjs",
    sourcemap: true,
    outfile: "dist/cjs/index.js",
    plugins: [
      glslify({
        compress: true,
        transform: ["glslify-import"],
      }),
    ],
    loader: {},
    external: ["gl-matrix", "@paosder/*"],
    watch: {
      onRebuild(error, result) {
        if (error) {
          console.error("esbuild failed:", error);
        } else {
          console.log("esbuild succeeded.");
          exec("yarn build:type", (err, stdout, stderr) => {
            if (err) {
              console.log("typescript compile failed.");
              console.log(stdout);
            } else {
              console.log("typescript compile succeeded.");
            }
          });
        }
      },
    },
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
