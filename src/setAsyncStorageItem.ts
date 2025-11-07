import { formatToStore } from "json-storage-formatter/formatToStore";
import { asyncStorageWrapper } from "./asyncStorageWrapper";
import type { AsyncStorageConfig } from "types";

export const setAsyncStorageItem = <T>(item: T, args: AsyncStorageConfig): void => {
  const asyncStorageKeySource = args.key;
  if (!asyncStorageKeySource) return;

  const asyncStorageKey = (() => {
    if (typeof asyncStorageKeySource === "function") {
      return asyncStorageKeySource();
    }

    return asyncStorageKeySource;
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

  asyncStorageWrapper.setItem(asyncStorageKey, parsed);
};

export default setAsyncStorageItem;
