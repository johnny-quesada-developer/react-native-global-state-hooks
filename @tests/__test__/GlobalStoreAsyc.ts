import {
  createCustomGlobalHook,
  GlobalStoreAbstract,
} from '../../src/GlobalStoreAbstract';

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

export class GlobalStore<
  TState,
  TMetadata extends {
    asyncStorageKey?: string;
    isAsyncStorageReady?: boolean;
  } | null = null,
  TStateSetter extends
    | ActionCollectionConfig<TState, TMetadata>
    | StateSetter<TState> = StateSetter<TState>
> extends GlobalStoreAbstract<TState, TMetadata, TStateSetter> {
  constructor(
    state: TState,
    config: GlobalStoreConfig<TState, TMetadata, TStateSetter> = {},
    setterConfig: TStateSetter | null = null
  ) {
    super(state, config, setterConfig);

    this.initialize();
  }

  protected onInitialize = async ({
    setState,
    setMetadata,
    getMetadata,
    getState,
  }: StateConfigCallbackParam<TState, TMetadata, TStateSetter>) => {
    const metadata = getMetadata();
    const asyncStorageKey = metadata?.asyncStorageKey;

    if (!asyncStorageKey) return;

    const storedItem = (await asyncStorage.getItem(asyncStorageKey)) as string;
    setMetadata({
      ...metadata,
      isAsyncStorageReady: true,
    });

    if (storedItem === null) {
      const state = getState();

      // force the re-render of the subscribed components even if the state is the same
      return setState(state, { forceUpdate: true });
    }

    const items = formatFromStore<TState>(storedItem, {
      jsonParse: true,
    });

    setState(items, { forceUpdate: true });
  };

  protected onChange = ({
    getMetadata,
    getState,
  }: StateChangesParam<TState, TMetadata, NonNullable<TStateSetter>>) => {
    const asyncStorageKey = getMetadata()?.asyncStorageKey;

    if (!asyncStorageKey) return;

    const state = getState();

    const formattedObject = formatToStore(state, {
      stringify: true,
    });

    asyncStorage.setItem(asyncStorageKey, formattedObject);
  };
}

export const createGlobalPersistedHook = createCustomGlobalHook<{
  asyncStorageKey?: string;
  isAsyncStorageReady: boolean;
}>({
  onInitialize: ({ setState, setMetadata, getMetadata, getState }) => {
    const metadata = getMetadata();
    const asyncStorageKey = metadata?.asyncStorageKey;

    if (!asyncStorageKey) return;

    const storedItem = asyncStorage.getItem(
      asyncStorageKey
    ) as unknown as string;

    setMetadata({
      ...metadata,
      isAsyncStorageReady: true,
    });

    if (storedItem === null) {
      const state = getState();

      // force the re-render of the subscribed components even if the state is the same
      return setState(state, { forceUpdate: true });
    }

    const items = formatFromStore(storedItem, {
      jsonParse: true,
    });

    setState(items, { forceUpdate: true });
  },

  onChange: ({ getMetadata, getState }) => {
    const asyncStorageKey = getMetadata()?.asyncStorageKey;

    if (!asyncStorageKey) return;

    const state = getState();

    const formattedObject = formatToStore(state, {
      stringify: true,
    });

    asyncStorage.setItem(asyncStorageKey, formattedObject);
  },
});

export const useCount = createGlobalPersistedHook(0, {
  metadata: {
    asyncStorageKey: 'count',
    test: 2,
  },
  setterConfig: {
    increase(increase: number) {
      return ({ setState, getState }): number => {
        setState((state) => state + increase);

        return getState();
      };
    },
  } as const,
});
