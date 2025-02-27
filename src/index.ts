/**
 * By handling the same structure as the original library,
 * We can add the specific overrides for web while keeping the modularity of the library.
 */
// #region base library exports copy of the original library index
export type {
  StateSetter,
  HookExtensions,
  ObservableFragment,
  MetadataSetter,
  StateChanges,
  StoreTools,
  ActionCollectionResult,
  GlobalStoreCallbacks,
  UseHookConfig,
  UnsubscribeCallback,
  SubscribeCallbackConfig,
  SubscribeCallback,
  StateGetter,
  BaseMetadata,
  MetadataGetter,
  CustomGlobalHookBuilderParams,
  SelectorCallback,
  SubscriberParameters,
  SubscriptionCallback,
  StateHook,
  ActionCollectionConfig,
  StateMeta,
} from "./types";

// classes
// export { GlobalStore } from './GlobalStore'; // overridden
// export { GlobalStoreAbstract } from './GlobalStoreAbstract';// overridden

// functions
// export { createGlobalState } from './createGlobalState'; // overridden
// export { createCustomGlobalState } from './createCustomGlobalState'; // overridden

// utils
export { shallowCompare } from "./shallowCompare";
export { debounce } from "./debounce";
export { uniqueId } from "./uniqueId";
export { throwWrongKeyOnActionCollectionConfig } from "./throwWrongKeyOnActionCollectionConfig";
export { isRecord } from "./isRecord";
export { uniqueSymbol, UniqueSymbol } from "./uniqueSymbol";
export { useStableState, type UseStableState } from "./useStableState";

// combiners
export { combineRetrieverAsynchronously } from "./combineRetrieverAsynchronously";
export { combineRetrieverEmitterAsynchronously } from "./combineRetrieverEmitterAsynchronously";

// context
export {
  ContextProviderAPI,
  ContextProvider,
  ContextHook,
  CreateContext,
  createContext,
} from "./createContext";

// #endregion base library exports

export { AsyncStorageConfig } from "./types";
export { GlobalStore } from "./GlobalStore";
export { GlobalStoreAbstract } from "./GlobalStoreAbstract";
export { CreateGlobalState, createGlobalState } from "./createGlobalState";
export { createCustomGlobalState, CustomCreateGlobalState } from "./createCustomGlobalState";
export { getAsyncStorageItem } from "./getAsyncStorageItem";
export { setAsyncStorageItem } from "./setAsyncStorageItem";
export { asyncStorageWrapper } from "./asyncStorageWrapper";
