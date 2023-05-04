const path = require("path");
// const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  mode: "production",
  entry: {
    bundle: "./src/index.ts",
  },
  externals: {
    react: "react",
  },
  output: {
    path: path.resolve(__dirname, "lib"),
    filename: ({ chunk: { name } }) => {
      return `${name}.js`;
    },
    libraryTarget: "umd",
    library: "react-native-global-state-hooks",
    globalObject: "this",
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      "react-native-global-state-hooks": path.resolve(
        __dirname,
        "node_modules/react-native-global-state-hooks/package.json"
      ),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [
                "@babel/preset-env",
                "@babel/preset-react",
                "@babel/preset-typescript",
              ],
              plugins: [
                "@babel/plugin-transform-modules-commonjs",
                "@babel/plugin-proposal-class-properties",
                "@babel/plugin-proposal-export-namespace-from",
              ],
            },
          },
          {
            loader: "ts-loader",
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  // plugins: [
  //   new CleanWebpackPlugin({
  //     cleanAfterEveryBuildPatterns: ["**/__test__/**"],
  //   }),
  // ],
};
