import * as GlobalStoreBase from "react-hooks-global-states";

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

export type TMetadataBase<TMetadata extends Record<string, unknown>> = {
  isAsyncStorageReady?: boolean;
  asyncStorageKey?: string;
} & Omit<NonNullable<TMetadata>, "isAsyncStorageReady" | "asyncStorageKey">;

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
  TMetadata extends Record<string, unknown>,
  TStateSetter extends
    | GlobalStoreBase.ActionCollectionConfig<TState, TMetadataBase<TMetadata>>
    | GlobalStoreBase.StateSetter<TState> = GlobalStoreBase.StateSetter<TState>
> = GlobalStoreBase.GlobalStoreConfig<
  TState,
  TMetadataBase<TMetadata>,
  TStateSetter
> &
  AsyncStorageConfig;

/**
 * Configuration of the state (optional) - if you don't need to use the state configuration you don't need to pass this parameter
 */
export type createStateConfig<
  TState,
  TMetadata extends Record<string, unknown>,
  TActions extends GlobalStoreBase.ActionCollectionConfig<
    TState,
    TMetadataBase<TMetadata>
  > | null = null
> = GlobalStoreBase.createStateConfig<
  TState,
  TMetadataBase<TMetadata> | TMetadata,
  TActions
> &
  AsyncStorageConfig;

/**
 * @description
 * Configuration of the custom global hook
 */
export type CustomGlobalHookParams<
  TCustomConfig,
  TState,
  TMetadata extends Record<string, unknown>,
  TActions extends GlobalStoreBase.ActionCollectionConfig<
    TState,
    TMetadataBase<TMetadata>
  > | null
> = GlobalStoreBase.CustomGlobalHookParams<
  TCustomConfig,
  TState,
  TMetadataBase<TMetadata>,
  TActions
> &
  AsyncStorageConfig;
