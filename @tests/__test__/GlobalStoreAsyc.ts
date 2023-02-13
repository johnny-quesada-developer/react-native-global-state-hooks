import { GlobalStore } from '../../src/GlobalStore';

import {
  ActionCollectionConfig,
  GlobalStoreConfig,
  StateChangesParam,
  StateConfigCallbackParam,
  StateSetter,
} from '../../src/GlobalStore.types';

import { formatFromStore, formatToStore } from 'json-storage-formatter';
import { getFakeAsyncStorage } from './getFakeAsyncStorage';

export const { fakeAsyncStorage: asyncStorage } = getFakeAsyncStorage();

/**
 * GlobalStoreAsync is a store that persists the state in the async storage
 * @template {TState} TState - The state of the store
 * @template {TMetadata} TMetadata - The metadata of the store, it must contain a readonly property called isAsyncStorageReady which cannot be set from outside the store
 * @template {TStateSetter} TStateSetter - The storeActionsConfig of the store
 */
export class GlobalStoreAsync<
  TState,
  // this restriction is needed to avoid the consumers to set the isAsyncStorageReady property from outside the store, even when the value will be ignored is better to avoid it to avoid confusion
  TMetadata extends { readonly isAsyncStorageReady: never },
  TStateSetter extends
    | ActionCollectionConfig<
        TState,
        Omit<TMetadata, 'isAsyncStorageReady'> & {
          readonly isAsyncStorageReady: boolean;
        }
      >
    | StateSetter<TState>
    | null = StateSetter<TState>
> extends GlobalStore<
  TState,
  Omit<TMetadata, 'isAsyncStorageReady'> & {
    readonly isAsyncStorageReady: boolean;
  },
  TStateSetter
> {
  /**
   * Config for the async storage
   * includes the asyncStorageKey and the metadata which will be used to determine if the async storage is ready or not
   * @template {TState} TState - The state of the store
   * @template {TMetadata} TMetadata - The metadata of the store
   * @template {TStateSetter} TStateSetter - The storeActionsConfig of the store
   **/
  protected config: NonNullable<
    GlobalStoreConfig<
      TState,
      Omit<TMetadata, 'isAsyncStorageReady'> & {
        readonly isAsyncStorageReady: boolean;
      },
      NonNullable<TStateSetter>
    >
  > & {
    asyncStorageKey: string;
  };

  /**
   * Creates a new instance of the GlobalStoreAsync
   * @param {TState} state - The initial state of the store
   * @param  {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config.metadata - The metadata of the store which will be used to determine if the async storage is ready or not, also it could store no reactive data
   * @param  {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config.asyncStorageKey - The key of the async storage
   * @param {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config - The config of the store
   * @param  {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config.onInit - The callback that will be called once the store is created
   * @param  {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config.onStateChange - The callback that will be called once the state is changed
   * @param  {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config.onSubscribed - The callback that will be called every time a new component is subscribed to the store
   * @param  {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config.computePreventStateChange - The callback that will be called before the state is changed, if it returns true the state will not be changed
   * @param {TStateSetter} setterConfig - The actions configuration object (optional) (default: null) if not null the store manipulation will be done through the actions
   */
  constructor(
    state: TState,
    config: GlobalStoreConfig<
      TState,
      TMetadata,
      ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>
    > & {
      asyncStorageKey: string;
    },
    setterConfig: TStateSetter | null = null
  ) {
    type TConfig = NonNullable<
      GlobalStoreConfig<
        TState,
        Omit<TMetadata, 'isAsyncStorageReady'> & {
          readonly isAsyncStorageReady: boolean;
        },
        NonNullable<TStateSetter>
      >
    > & {
      asyncStorageKey: string;
    };

    const { onInit: onInitConfig, ...configParameters } = config as TConfig;

    super(state, configParameters, setterConfig as TStateSetter);

    this.config = {
      ...config,
      metadata: {
        ...configParameters.metadata,
        isAsyncStorageReady: false,
      },
    } as TConfig;

    const parameters = this.getConfigCallbackParam({});

    this.onInit(parameters);
    onInitConfig?.(parameters);
  }

  /**
   * This method will be called once the store is created after the constructor,
   * this method is different from the onInit of the confg property and it won't be overriden
   */
  protected onInit = async ({
    setState,
    setMetadata,
    getMetadata,
  }: StateConfigCallbackParam<
    TState,
    Omit<TMetadata, 'isAsyncStorageReady'> & {
      readonly isAsyncStorageReady: boolean;
    },
    NonNullable<TStateSetter>
  >) => {
    const { asyncStorageKey } = this.config;
    const storedItem: string = await asyncStorage.getItem(asyncStorageKey);

    setMetadata({
      ...getMetadata(),
      isAsyncStorageReady: true,
    });

    if (storedItem === null) return;

    const jsonParsed = JSON.parse(storedItem);
    const items = formatFromStore<TState>(jsonParsed);

    setState(items);
  };

  protected onStateChanged = ({
    getState,
  }: StateChangesParam<
    TState,
    Omit<TMetadata, 'isAsyncStorageReady'> & {
      readonly isAsyncStorageReady: boolean;
    },
    NonNullable<TStateSetter>
  >) => {
    const { asyncStorageKey } = this.config;

    const state = getState();
    const formattedObject = formatToStore(state, {
      stringify: true,
    });

    asyncStorage.setItem(asyncStorageKey, formattedObject);
  };
}
