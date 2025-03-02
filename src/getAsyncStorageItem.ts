import type { AsyncStorageConfig } from "./types";
import { asyncStorageWrapper } from "./asyncStorageWrapper";
import { formatFromStore } from "json-storage-formatter/formatFromStore";

export const getAsyncStorageItem = async <TState>(args: AsyncStorageConfig): Promise<TState> => {
  const localStorageKeySource = args.key;
  if (!localStorageKeySource) return null;

  const localStorageKey = (() => {
    if (typeof localStorageKeySource === "function") {
      return localStorageKeySource();
    }

    return localStorageKeySource;
  })();

  const storedItem = await asyncStorageWrapper.getItem(localStorageKey);
  if (storedItem === null) return null;

  const json = (() => {
    if (!args.decrypt && !args.encrypt) return storedItem;

    if (typeof args.decrypt === "function") {
      return args.decrypt(storedItem);
    }

    return atob(storedItem);
  })();

  const value = formatFromStore<TState>(json, {
    jsonParse: true,
  });

  return value;
};

export default getAsyncStorageItem;
