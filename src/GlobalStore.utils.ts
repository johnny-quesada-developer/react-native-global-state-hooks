import { GlobalStoreConfig } from "./GlobalStore.types";
import asyncStorage from "@react-native-async-storage/async-storage";
import { formatFromStore, formatToStore } from "react-hooks-global-states";

/**
 * @description
 * Get an item from local storage using the config provided.
 */
export const getAsyncStorageItem = async <TState, TMetadata = null>({
  config,
}: {
  config: GlobalStoreConfig<TState, TMetadata>;
}): Promise<TState> => {
  const asyncStorageKey = config?.asyncStorage?.key;
  if (!asyncStorageKey) return null;

  const storedItem = (await asyncStorage.getItem(asyncStorageKey)) as string;

  if (storedItem === null) return null;

  const json = (() => {
    const { decrypt, encrypt } = config?.asyncStorage ?? {};

    if (!decrypt && !encrypt) return storedItem;

    if (typeof decrypt === "function") {
      return decrypt(storedItem);
    }

    return atob(storedItem);
  })();

  const value = formatFromStore<TState>(json, {
    jsonParse: true,
  });

  return value;
};

/**
 * @description
 * Set an item to local storage using the config provided.
 */
export const setAsyncStorageItem = async <TState, TMetadata = null>({
  item,
  config,
}: {
  config: GlobalStoreConfig<TState, TMetadata>;
  item: TState;
}): Promise<void> => {
  const asyncStorageKey = config?.asyncStorage?.key;
  if (!asyncStorageKey) return null;

  const json = formatToStore(item, {
    stringify: true,
    excludeTypes: ["function"],
  });

  const parsed = (() => {
    const { encrypt } = config?.asyncStorage ?? {};

    if (!encrypt) return json;

    if (typeof encrypt === "function") {
      return encrypt(json);
    }

    return btoa(json);
  })();

  await asyncStorage.setItem(asyncStorageKey, parsed);
};
