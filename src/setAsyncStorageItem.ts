import { formatToStore } from "json-storage-formatter/formatToStore";
import { asyncStorageWrapper } from "./asyncStorageWrapper";
import type { AsyncStorageConfig } from "types";

export const setAsyncStorageItem = <T>(item: T, args: AsyncStorageConfig): void => {
  const localStorageKeySource = args.key;
  if (!localStorageKeySource) return;

  const localStorageKey = (() => {
    if (typeof localStorageKeySource === "function") {
      return localStorageKeySource();
    }

    return localStorageKeySource;
  })();

  const json = formatToStore(item, {
    stringify: true,
    excludeTypes: ["function"],
  });

  const parsed = (() => {
    if (!args.encrypt) return json;

    if (typeof args.encrypt === "function") {
      return args.encrypt(json);
    }

    return btoa(json);
  })();

  asyncStorageWrapper.setItem(localStorageKey, parsed);
};
