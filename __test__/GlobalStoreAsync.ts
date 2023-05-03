import { GlobalStoreAbstract } from "../src/GlobalStoreAbstract";

import {
  ActionCollectionConfig,
  GlobalStoreConfig,
  StateChangesParam,
  StateConfigCallbackParam,
  StateSetter,
} from "../src/GlobalStore.types";

import { formatFromStore, formatToStore } from "json-storage-formatter";
import { getFakeAsyncStorage } from "./getFakeAsyncStorage";
import { createCustomGlobalStateWithDecoupledFuncs } from "../src/GlobalStore.functions";

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
    actionsConfig: TStateSetter | null = null
  ) {
    super(state, config, actionsConfig);

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

type BaseMetadata = {
  isAsyncStorageReady?: boolean;
};

type HookConfig = {
  asyncStorageKey?: string;
};

export const createGlobalState = createCustomGlobalStateWithDecoupledFuncs<
  BaseMetadata,
  HookConfig
>({
  onInitialize: async ({ setState, setMetadata }, config) => {
    setMetadata((metadata) => ({
      ...(metadata ?? {}),
      isAsyncStorageReady: null,
    }));

    const asyncStorageKey = config?.asyncStorageKey;
    if (!asyncStorageKey) return;

    const storedItem = (await asyncStorage.getItem(asyncStorageKey)) as string;

    setMetadata((metadata) => ({
      ...metadata,
      isAsyncStorageReady: true,
    }));

    if (storedItem === null) {
      return setState((state) => state, { forceUpdate: true });
    }

    const parsed = formatFromStore(storedItem, {
      jsonParse: true,
    });

    setState(parsed, { forceUpdate: true });
  },

  onChange: ({ getState }, config) => {
    if (!config?.asyncStorageKey) return;

    const state = getState();

    const formattedObject = formatToStore(state, {
      stringify: true,
    });

    asyncStorage.setItem(config.asyncStorageKey, formattedObject);
  },
});
