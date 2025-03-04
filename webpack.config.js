const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

const individualEntries = {
  // inherit from react-global-state-hooks
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
  generateStackHash: "./src/generateStackHash.ts",

  // extras
  asyncStorageWrapper: "./src/asyncStorageWrapper.ts",
  getAsyncStorageItem: "./src/getAsyncStorageItem.ts",
  setAsyncStorageItem: "./src/setAsyncStorageItem.ts",
};

const getExternalsForEntries = () => {
  const keys = Object.keys(individualEntries);
  const fromEntries = keys.reduce((acc, key) => {
    acc[`./${key}`] = `./${key}.js`;
    return acc;
  }, {});

  const fromBasePackage = keys.reduce((acc, key) => {
    acc[`react-hooks-global-states/${key}`] = `react-hooks-global-states/${key}`;
    return acc;
  }, {});

  return {
    ...fromEntries,
    ...fromBasePackage,
  };
};

module.exports = {
  mode: "production",
  entry: {
    bundle: "./src/index.ts",
    ...individualEntries,
  },
  externals: {
    react: "react",
    "react-native": "react-native",
    "@react-native-async-storage/async-storage": "@react-native-async-storage/async-storage",

    // avoid bundle the base package
    "json-storage-formatter": "json-storage-formatter",
    "json-storage-formatter/clone": "json-storage-formatter/clone",
    "json-storage-formatter/isNil": "json-storage-formatter/isNil",
    "json-storage-formatter/isNumber": "json-storage-formatter/isNumber",
    "json-storage-formatter/isBoolean": "json-storage-formatter/isBoolean",
    "json-storage-formatter/isString": "json-storage-formatter/isString",
    "json-storage-formatter/isDate": "json-storage-formatter/isDate",
    "json-storage-formatter/isRegex": "json-storage-formatter/isRegex",
    "json-storage-formatter/isFunction": "json-storage-formatter/isFunction",
    "json-storage-formatter/isPrimitive": "json-storage-formatter/isPrimitive",
    "json-storage-formatter/types": "json-storage-formatter/types",
    "json-storage-formatter/formatFromStore": "json-storage-formatter/formatFromStore",
    "json-storage-formatter/formatToStore": "json-storage-formatter/formatToStore",

    "react-hooks-global-states": "react-hooks-global-states",

    ...getExternalsForEntries(),
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
