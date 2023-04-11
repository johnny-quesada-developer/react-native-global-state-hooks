import { GlobalStore as GlobalStoreBase } from '../../src/GlobalStore';

import {
  ActionCollectionConfig,
  StateChangesParam,
  StateConfigCallbackParam,
  StateSetter,
} from '../../src/GlobalStore.types';

import { clone, formatFromStore, formatToStore } from 'json-storage-formatter';
import { getFakeAsyncStorage } from './getFakeAsyncStorage';

export const { fakeAsyncStorage: asyncStorage } = getFakeAsyncStorage();

/**
 * GlobalStore is an store that could also persist the state in the async storage
 * @template {TState} TState - The state of the store
 * @template {TMetadata} TMetadata - The metadata of the store, it must contain a readonly property called isAsyncStorageReady which cannot be set from outside the store
 * @template {TStateSetter} TStateSetter - The storeActionsConfig of the store
 */
export class GlobalStore<
  TState,
  // this restriction is needed to avoid the consumers to set the isAsyncStorageReady property from outside the store,
  // ... even when the value will be ignored is better to avoid it to avoid confusion
  TMetadata extends { readonly isAsyncStorageReady?: never } & Record<
    string,
    unknown
  > = {},
  TStateSetter extends StorageSetter<TState, TMetadata> = StateSetter<TState>
> extends GlobalStoreBase<TState, StorageMetadata<TMetadata>, TStateSetter> {
  /**
   * Config for the async storage
   * includes the asyncStorageKey and the metadata which will be used to determine if the async storage is ready or not
   * @template {TState} TState - The state of the store
   * @template {TMetadata} TMetadata - The metadata of the store
   * @template {TStateSetter} TStateSetter - The storeActionsConfig of the store
   **/
  protected config: StorageConfig<TState, TMetadata, TStateSetter> = {};

  /**
   * Creates a new instance of the GlobalStore
   * @param {TState} state - The initial state of the store
   * @param {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config - The config of the store
   * @param  {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config.metadata - The metadata of the store which will be used to determine if the async storage is ready or not, also it could store no reactive data
   * @param  {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config.asyncStorageKey - The key of the async storage
   * @param  {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config.onInit - The callback that will be called once the store is created
   * @param  {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config.onStateChange - The callback that will be called once the state is changed
   * @param  {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config.onSubscribed - The callback that will be called every time a new component is subscribed to the store
   * @param  {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config.computePreventStateChange - The callback that will be called before the state is changed, if it returns true the state will not be changed
   * @param {TStateSetter} setterConfig - The actions configuration object (optional) (default: null) if not null the store manipulation will be done through the actions
   */
  constructor(
    state: TState,
    config: StorageConfig<TState, TMetadata, TStateSetter> | null = null,
    setterConfig: TStateSetter | null = null
  ) {
    const { onInit, asyncStorageKey, ...configParameters } =
      config ?? ({} as StorageConfig<TState, TMetadata, TStateSetter>);

    super(state, configParameters, setterConfig as TStateSetter);

    // if there is not async storage key this is not a persistent store
    const isAsyncStorageReady: boolean | null = asyncStorageKey ? false : null;

    this.config = {
      ...config,
      metadata: {
        ...((configParameters.metadata ?? {}) as TMetadata),
        isAsyncStorageReady,
      },
    };

    const hasInitCallbacks = !!(asyncStorageKey || onInit);
    if (!hasInitCallbacks) return;

    const parameters = this.getConfigCallbackParam({});

    this.onInit(parameters);
    onInit?.(parameters);
  }

  /**
   * This method will be called once the store is created after the constructor,
   * this method is different from the onInit of the config property and it won't be overridden
   */
  protected onInit = async ({
    setState,
    setMetadata,
    getMetadata,
  }: StateConfigCallbackParam<
    TState,
    StorageMetadata<TMetadata>,
    NonNullable<TStateSetter>
  >) => {
    const { asyncStorageKey } = this.config;
    if (!asyncStorageKey) return;

    const storedItem = (await asyncStorage.getItem(asyncStorageKey)) as string;

    setMetadata({
      ...getMetadata(),
      isAsyncStorageReady: true,
    });

    if (storedItem === null) {
      const state = clone(this.state);

      // this forces the react to re-render the component when the state is an object
      return setState(state);
    }

    const jsonParsed = JSON.parse(storedItem);
    const items = formatFromStore<TState>(jsonParsed);

    setState(items);
  };

  protected onStateChanged = ({
    getState,
  }: StateChangesParam<
    TState,
    StorageMetadata<TMetadata>,
    NonNullable<TStateSetter>
  >) => {
    const { asyncStorageKey } = this.config;
    if (!asyncStorageKey) return;

    const state = getState();
    const formattedObject = formatToStore(state, {
      stringify: true,
    });

    asyncStorage.setItem(asyncStorageKey, formattedObject);
  };
}

/**
 * Metadata of the store
 * @template {TMetadata} TMetadata - The metadata type which also contains the isAsyncStorageReady property
 */
type StorageMetadata<TMetadata> = Omit<TMetadata, 'isAsyncStorageReady'> & {
  readonly isAsyncStorageReady?: boolean | null;
};

/**
 * The setter of the store
 * @template {TState} TState - The state of the store
 * @template {TMetadata} TMetadata - The metadata of the store, it must contain a readonly property called isAsyncStorageReady which cannot be set from outside the store
 * */
type StorageSetter<TState, TMetadata> =
  | ActionCollectionConfig<TState, StorageMetadata<TMetadata>>
  | StateSetter<TState>
  | null;

/**
 * Config for the async storage
 * includes the asyncStorageKey
 * @template {TState} TState - The state of the store
 * @template {TMetadata} TMetadata - The metadata of the store, it must contain a readonly property called isAsyncStorageReady which cannot be set from outside the store
 * @template {TStateSetter} TStateSetter - The storeActionsConfig of the store
 */
type StorageConfig<
  TState,
  TMetadata extends { readonly isAsyncStorageReady?: never },
  TStateSetter extends
    | ActionCollectionConfig<TState, StorageMetadata<TMetadata>>
    | StateSetter<TState>
    | null = StateSetter<TState>
> = {
  asyncStorageKey?: string;

  metadata?: TMetadata;

  onInit?: (
    parameters: StateConfigCallbackParam<
      TState,
      StorageMetadata<TMetadata>,
      NonNullable<TStateSetter>
    >
  ) => void;

  onStateChanged?: (
    parameters: StateChangesParam<
      TState,
      StorageMetadata<TMetadata>,
      NonNullable<TStateSetter>
    >
  ) => void;

  onSubscribed?: (
    parameters: StateConfigCallbackParam<
      TState,
      StorageMetadata<TMetadata>,
      NonNullable<TStateSetter>
    >
  ) => void;

  computePreventStateChange?: (
    parameters: StateChangesParam<
      TState,
      StorageMetadata<TMetadata>,
      NonNullable<TStateSetter>
    >
  ) => boolean;
};
