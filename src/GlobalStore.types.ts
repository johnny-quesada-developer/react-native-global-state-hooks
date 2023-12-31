import * as GlobalStoreBase from "react-hooks-global-states";
import { MetadataSetter, StateSetter } from "react-hooks-global-states";

/**
 * Configuration of the async storage (optional)
 */
export type AsyncStorageConfig = {
  /**
   * async storage configuration
   */
  asyncStorage?: {
    /**
     * The key of the async storage
     */
    key?: string;

    /**
     * The function used to encrypt the async storage, it can be a custom function or a boolean value (true = atob)
     */
    encrypt?: boolean | ((value: string) => string);

    /**
     * The function used to decrypt the async storage, it can be a custom function or a boolean value (true = atob)
     */
    decrypt?: boolean | ((value: string) => string);
  };
};

export type TMetadataResult<TMetadata = null> = {
  isAsyncStorageReady?: boolean;
  asyncStorageKey?: string;
} & Omit<NonNullable<TMetadata>, "isAsyncStorageReady" | "asyncStorageKey">;

/**
 * Callbacks to be passed to the configurations function of the store
 * @template {TState} TState - The state type
 * @template {TMetadata} TMetadata - The metadata type
 * @property {StateSetter<TState>} setMetadata - Set the metadata
 * @property {StateSetter<TState>} setState - Set the state
 * @property {() => TState} getState - Get the state
 * @property {() => TMetadata} getMetadata - Get the metadata
 * @property {ActionCollectionResult<TState, TMetadata>} actions - The actions collection if any
 **/
export type StoreTools<TState = any, TMetadata = any, TActions = any> = Omit<
  GlobalStoreBase.StoreTools<TState, TMetadata, TActions>,
  "getMetadata" | "setMetadata"
> & {
  getMetadata: () => TMetadataResult<TMetadata>;
  setMetadata:
    | MetadataSetter<TMetadataResult<TMetadata>>
    | MetadataSetter<TMetadata>;
};

/**
 * Basic contract for the storeActionsConfig configuration
 * @template {TState} TState - The state type
 * @template {TMetadata} TMetadata - The metadata type
 * @property {string} key - The action name
 * @property {(...parameters: unknown[]) => (storeTools: { setMetadata: MetadataSetter<TMetadata>; setState: StateSetter<TState>; getState: () => TState; getMetadata: () => TMetadata; }) => unknown | void} value - The action function
 * @returns {ActionCollectionConfig<TState, TMetadata>} result - The action collection configuration
 */
export interface ActionCollectionConfig<TState, TMetadata = null> {
  [key: string]: (...parameters: any[]) => (storeTools: any) => unknown | void;
}

/**
 * This is the actions object returned by the hook when you pass an storeActionsConfig configuration
 * if you pass an storeActionsConfig configuration, the hook will return an object with the actions
 * whatever data manipulation of the state should be executed through the custom actions with as access to the state and metadata
 * @template {TState} TState - The state type
 * @template {TMetadata} TMetadata - The metadata type
 * @template {TStateSetter} TStateSetter - The storeActionsConfig type (optional) - if you pass an storeActionsConfig the hook will return an object with the actions
 *
 * @example
 *
 * const store = new GlobalStore(0, {
 *  increment: () => ({ setState }) => {
 *    setState((state) => state + 1);
 *  },
 *  decrement: () => ({ setState }) => {
 *    setState((state) => state - 1);
 *  },
 * });
 *
 * const [state, actions] = store.getHook();
 *
 * actions.increment();
 * actions.decrement();
 *
 * console.log(state); // 0
 */
export type ActionCollectionResult<
  TState,
  TMetadata,
  TStateSetter extends
    | ActionCollectionConfig<TState, TMetadata>
    | StateSetter<TState> = StateSetter<TState>
> = TStateSetter extends ActionCollectionConfig<TState, TMetadata>
  ? {
      /**
       * @description
       * A new object with will be created with the same keys of the storeActionsConfig object
       */
      [key in keyof TStateSetter]: (
        ...params: Parameters<TStateSetter[key]>
      ) => ReturnType<ReturnType<TStateSetter[key]>>;
    }
  : null;

/**
 * Common parameters of the store configuration callback functions
 * @param {StateSetter<TState>} setState - add a new value to the state
 * @param {() => TState} getState - get the current state
 * @param {MetadataSetter<TMetadata>} setMetadata - add a new value to the metadata
 * @param {() => TMetadata} getMetadata - get the current metadata
 * @param {ActionCollectionResult<TState, ActionCollectionConfig<TState, TMetadata>> | null} actions - the actions object returned by the hook when you pass an storeActionsConfig configuration otherwise null
 * @template {TState} TState - The state type
 * @template {TMetadata} TMetadata - The metadata type
 * @template {TStateSetter} TStateSetter - The storeActionsConfig type (optional) - if you pass an storeActionsConfig the hook will return an object with the actions
 * @template {ActionCollectionResult<TState, TStateSetter>} TStateSetter - the result of the API (optional) - if you don't pass an API as a parameter, you can pass null
 * */
export type StateConfigCallbackParam<
  TState = any,
  TMetadata = null,
  TStateSetter extends
    | ActionCollectionConfig<TState, TMetadata>
    | GlobalStoreBase.StateSetter<TState> = GlobalStoreBase.StateSetter<TState>
> = {
  actions: ActionCollectionResult<TState, TMetadata, TStateSetter>;
} & StoreTools<TState, TMetadata>;

/**
 * Parameters of the onStateChanged callback function
 * @template {TState} TState - The state type
 * @template {TMetadata} TMetadata - The metadata type
 * @template {TStateSetter} TStateSetter - The storeActionsConfig type (optional) - if you pass an storeActionsConfig the hook will return an object with the actions
 */
export type StateChangesParam<
  TState = any,
  TMetadata = null,
  TStateSetter extends
    | ActionCollectionConfig<TState, TMetadata>
    | GlobalStoreBase.StateSetter<TState> = GlobalStoreBase.StateSetter<TState>
> = StateConfigCallbackParam<TState, TMetadata, TStateSetter> &
  GlobalStoreBase.StateChanges<TState>;

/**
 * Configuration of the store (optional) - if you don't need to use the store configuration you don't need to pass this parameter
 * @param {StateConfigCallbackParam<TState, TMetadata> => void} onInit - callback function called when the store is initialized
 * @param {StateConfigCallbackParam<TState, TMetadata> => void} onSubscribed - callback function called every time a component is subscribed to the store
 * @param {StateChangesParam<TState, TMetadata> => boolean} computePreventStateChange - callback function called every time the state is changed and it allows you to prevent the state change
 * @param {StateChangesParam<TState, TMetadata> => void} onStateChanged - callback function called every time the state is changed
 * @template TState - the type of the state
 * @template TMetadata - the type of the metadata (optional) - if you don't pass an metadata as a parameter, you can pass null
 * @template {ActionCollectionConfig<TState,TMetadata> | null} TStateSetter - the configuration of the API (optional) - if you don't pass an API as a parameter, you can pass null
 * */
export type GlobalStoreConfig<
  TState,
  TMetadata,
  TStateSetter extends
    | ActionCollectionConfig<TState, TMetadata>
    | GlobalStoreBase.StateSetter<TState> = GlobalStoreBase.StateSetter<TState>
> = GlobalStoreBase.GlobalStoreConfig<TState, TMetadata, TStateSetter> &
  AsyncStorageConfig;

/**
 * Configuration of the state (optional) - if you don't need to use the state configuration you don't need to pass this parameter
 */
export type createStateConfig<
  TState,
  TMetadata,
  TActions extends ActionCollectionConfig<TState, TMetadata> | null = null
> = GlobalStoreBase.createStateConfig<TState, TMetadata, TActions> &
  AsyncStorageConfig;

/**
 * @description
 * Configuration of the custom global hook
 */
export type CustomGlobalHookParams<
  TCustomConfig,
  TState,
  TMetadata,
  TActions extends ActionCollectionConfig<TState, TMetadata> | null
> = GlobalStoreBase.CustomGlobalHookParams<
  TCustomConfig,
  TState,
  TMetadata,
  TActions
> &
  AsyncStorageConfig;
