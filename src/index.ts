/**
 * By handling the same structure as the original library,
 * We can add the specific overrides for web while keeping the modularity of the library.
 */
// #region base library exports copy of the original library index
export type {
  StateApi,
  ObservableFragment,
  MetadataSetter,
  StateChanges,
  StoreTools,
  ActionCollectionResult,
  GlobalStoreCallbacks,
  UseHookOptions,
  UnsubscribeCallback,
  SubscribeCallbackConfig,
  SubscribeCallback,
  BaseMetadata as BaseMetadata,
  MetadataGetter,
  SelectorCallback,
  SubscriberParameters,
  SubscriptionCallback,
  StateHook,
  ActionCollectionConfig,
} from "./types";

// classes
// export { GlobalStore } from './GlobalStore'; // overridden

// functions
// export { createGlobalState } from './createGlobalState'; // overridden

// utils
export { shallowCompare } from "./shallowCompare";
export { uniqueId } from "./uniqueId";
export { throwWrongKeyOnActionCollectionConfig } from "./throwWrongKeyOnActionCollectionConfig";
export { isRecord } from "./isRecord";

// context
export { type ContextProvider, type ContextHook, type InferContextApi, createContext } from "./createContext";

// #endregion base library exports

export type { AsyncStorageConfig } from "./types";
export { GlobalStore } from "./GlobalStore";
export { createGlobalState, type InferActionsType, type InferStateApi } from "./createGlobalState";
export { default as asyncStorageWrapper, type AsyncStorageManager } from "./asyncStorageWrapper";
