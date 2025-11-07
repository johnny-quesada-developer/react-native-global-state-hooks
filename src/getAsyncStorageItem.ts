import type { AsyncStorageConfig } from "./types";
import { asyncStorageWrapper } from "./asyncStorageWrapper";
import { formatFromStore } from "json-storage-formatter/formatFromStore";

/**
 * Gets an item from async storage
 * @param args AsyncStorageConfig configuration
 * @returns The stored value or null if not found
 */
export const getAsyncStorageItem = async <TState>(args: AsyncStorageConfig): Promise<TState> => {
  const asyncStorageKeySource = args.key;
  if (!asyncStorageKeySource) return null;

  const asyncStorageKey = (() => {
    if (typeof asyncStorageKeySource === "function") {
      return asyncStorageKeySource();
    }

    return asyncStorageKeySource;
  })();

  const storedItem = await asyncStorageWrapper.getItem(asyncStorageKey);
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
