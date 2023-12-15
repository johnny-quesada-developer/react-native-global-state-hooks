import { GlobalStoreConfig, TMetadataBase } from "./GlobalStore.types";
import { getAsyncStorageItem, setAsyncStorageItem } from "./GlobalStore.utils";

import {
  ActionCollectionConfig,
  GlobalStoreAbstract,
  StateChangesParam,
  StateConfigCallbackParam,
  StateSetter,
} from "react-hooks-global-states";

export class GlobalStore<
  TState,
  TMetadata extends Record<string, unknown>,
  TStateSetter extends
    | ActionCollectionConfig<TState, TMetadataBase<TMetadata>>
    | StateSetter<TState> = StateSetter<TState>
> extends GlobalStoreAbstract<
  TState,
  TMetadataBase<TMetadata>,
  NonNullable<TStateSetter>
> {
  protected config: GlobalStoreConfig<TState, TMetadata, TStateSetter>;

  constructor(
    state: TState,
    config: GlobalStoreConfig<TState, TMetadata, TStateSetter> = {},
    actionsConfig: TStateSetter | null = null
  ) {
    super(state, config, actionsConfig);

    const isExtensionClass = this.constructor !== GlobalStore;
    if (isExtensionClass) return;

    this.initialize();
  }

  protected onInitialize = ({
    setState,
    getState,
    setMetadata,
  }: StateConfigCallbackParam<TState, TMetadataBase<TMetadata>>) => {
    (async () => {
      const localStorageKey = this.config?.asyncStorage?.key;

      if (!localStorageKey) return;

      setMetadata((metadata) => ({
        ...metadata,
        isAsyncStorageReady: false,
      }));

      let restored: TState = await getAsyncStorageItem({
        config: this.config,
      });

      setMetadata((metadata) => ({
        ...metadata,
        isAsyncStorageReady: true,
      }));

      if (restored === null) {
        restored = getState();

        setAsyncStorageItem({
          item: restored,
          config: this.config,
        });
      }

      // force update to trigger the subscribers in case the state is the same
      setState(restored, {
        forceUpdate: true,
      });
    })();
  };

  protected onChange = ({
    getState,
  }: StateChangesParam<
    TState,
    TMetadataBase<TMetadata>,
    NonNullable<TStateSetter>
  >) => {
    setAsyncStorageItem({
      item: getState(),
      config: this.config,
    });
  };
}
