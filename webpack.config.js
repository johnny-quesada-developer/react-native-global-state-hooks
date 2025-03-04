const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  mode: "production",
  entry: {
    // inherit from react-global-state-hooks
    bundle: "./src/index.ts",
    createContext: "./src/createContext.ts",
    GlobalStore: "./src/GlobalStore.ts",
    GlobalStoreAbstract: "./src/GlobalStoreAbstract.ts",
    createCustomGlobalState: "./src/createCustomGlobalState.ts",
    createGlobalState: "./src/createGlobalState.ts",
    types: "./src/types.ts",
    debounce: "./src/debounce.ts",
    isRecord: "./src/isRecord.ts",
    shallowCompare: "./src/shallowCompare.ts",
    throwWrongKeyOnActionCollectionConfig: "./src/throwWrongKeyOnActionCollectionConfig.ts",
    uniqueId: "./src/uniqueId.ts",
    uniqueSymbol: "./src/uniqueSymbol.ts",
    useStableState: "./src/useStableState.ts",
    // extras
    asyncStorageWrapper: "./src/asyncStorageWrapper.ts",
    getAsyncStorageItem: "./src/getAsyncStorageItem.ts",
    setAsyncStorageItem: "./src/setAsyncStorageItem.ts",
  },
  externals: {
    react: "react",
    "react-native": "react-native",
    "@react-native-async-storage/async-storage": "@react-native-async-storage/async-storage",
    // avoid bundle the base package
    "react-hooks-global-states": "react-hooks-global-states",
    "react-hooks-global-states/createContext": "react-hooks-global-states/createContext",
    "react-hooks-global-states/GlobalStore": "react-hooks-global-states/GlobalStore",
    "react-hooks-global-states/GlobalStoreAbstract": "react-hooks-global-states/GlobalStoreAbstract",
    "react-hooks-global-states/createCustomGlobalState": "react-hooks-global-states/createCustomGlobalState",
    "react-hooks-global-states/createGlobalState": "react-hooks-global-states/createGlobalState",
    "react-hooks-global-states/types": "react-hooks-global-states/types",
    "react-hooks-global-states/debounce": "react-hooks-global-states/debounce",
    "react-hooks-global-states/isRecord": "react-hooks-global-states/isRecord",
    "react-hooks-global-states/shallowCompare": "react-hooks-global-states/shallowCompare",
    "react-hooks-global-states/throwWrongKeyOnActionCollectionConfig":
      "react-hooks-global-states/throwWrongKeyOnActionCollectionConfig",
    "react-hooks-global-states/uniqueId": "react-hooks-global-states/uniqueId",
    "react-hooks-global-states/uniqueSymbol": "react-hooks-global-states/uniqueSymbol",
    "react-hooks-global-states/useStableState": "react-hooks-global-states/useStableState",
    "react-hooks-global-states/generateStackHash": "react-hooks-global-states/generateStackHash",
    // inherit from react-global-state-hooks
    "./createContext": "./createContext.js",
    "./GlobalStore": "./GlobalStore.js",
    "./GlobalStoreAbstract": "./GlobalStoreAbstract.js",
    "./createCustomGlobalState": "./createCustomGlobalState.js",
    "./createGlobalState": "./createGlobalState.js",
    "./types": "./types.js",
    "./debounce": "./debounce.js",
    "./isRecord": "./isRecord.js",
    "./shallowCompare": "./shallowCompare.js",
    "./throwWrongKeyOnActionCollectionConfig": "./throwWrongKeyOnActionCollectionConfig.js",
    "./uniqueId": "./uniqueId.js",
    "./uniqueSymbol": "./uniqueSymbol.js",
    "./useStableState": "./useStableState.js",
    // extras
    "./asyncStorageWrapper": "./asyncStorageWrapper.js",
    "./getAsyncStorageItem": "./getAsyncStorageItem.js",
    "./setAsyncStorageItem": "./setAsyncStorageItem.js",
  },
  output: {
    path: path.resolve(__dirname),
    filename: ({ chunk: { name } }) => {
      return `${name}.js`;
    },
    libraryTarget: "umd",
    library: "react-native-global-state-hooks",
    globalObject: "this",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-react", "@babel/preset-typescript"],
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
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          format: {
            comments: false,
          },
        },
      }),
    ],
  },
};
