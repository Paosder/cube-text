import { CleanWebpackPlugin } from "clean-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import path from "path";
import webpack from "webpack";
import kill from "tree-kill";

const __dirname = path.resolve();
const { pid } = process;
process.on("SIGINT", () => {
  // sometimes webpack does not shutdown gracefully, so kill it if exists.
  kill(pid, "SIGKILL");
});

export default {
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "index.js",
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {},
  },
  stats: "errors-only",
  mode: "development",
  devtool: "inline-source-map",
  entry: {
    main: "./src/playground.ts",
  },
  devServer: {
    contentBase: "./dist",
    clientLogLevel: "info",
    port: "8080",
    hot: true,
    host: "0.0.0.0",
    disableHostCheck: true,
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        exclude: [path.resolve(__dirname, "node_modules")],
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
      {
        test: /\.(vert|frag|comp|glsl)/,
        type: "asset/source",
      },
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
      },
    ],
  },
  experiments: {
    topLevelAwait: true,
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      title: "Example Page",
    }),
  ],
};
