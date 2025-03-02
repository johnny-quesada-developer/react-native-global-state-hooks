import type {
  ActionCollectionConfig,
  GlobalStoreCallbacks,
  StateChanges,
  StoreTools,
} from "react-hooks-global-states/types";
import type { AsyncStorageConfig, BaseMetadata, StateMeta } from "./types";

import { GlobalStoreAbstract } from "react-hooks-global-states/GlobalStoreAbstract";
import { getAsyncStorageItem } from "./getAsyncStorageItem";
import { setAsyncStorageItem } from "./setAsyncStorageItem";

export class GlobalStore<
  State,
  Metadata extends BaseMetadata | unknown,
  ActionsConfig extends ActionCollectionConfig<State, StateMeta<Metadata>> | undefined | unknown
> extends GlobalStoreAbstract<State, StateMeta<Metadata>, ActionsConfig> {
  protected asyncStorage: AsyncStorageConfig | null = null;

  constructor(state: State);

  constructor(
    state: State,
    args: {
      metadata?: Metadata;
      callbacks?: GlobalStoreCallbacks<State, Metadata>;
      actions?: ActionsConfig;
      name?: string;
      asyncStorage?: AsyncStorageConfig;
    }
  );

  constructor(
    state: State,
    args: {
      metadata?: Metadata;
      callbacks?: GlobalStoreCallbacks<State, StateMeta<Metadata>>;
      actions?: ActionsConfig;
      name?: string;
      asyncStorage?: AsyncStorageConfig;
    } = { metadata: {} as Metadata }
  ) {
    super(
      state,
      args as {
        metadata: StateMeta<Metadata>;
        callbacks: GlobalStoreCallbacks<State, StateMeta<Metadata>>;
        actions: ActionsConfig;
        name: string;
        asyncStorage: AsyncStorageConfig;
      }
    );

    this.asyncStorage = args.asyncStorage ?? null;

    this.setMetadata(
      (metadata) =>
        ({
          ...(metadata ?? {}),
          isAsyncStorageReady: false,
          asyncStorageKey: this.asyncStorage?.key ?? null,
        } as StateMeta<Metadata>)
    );

    const isExtensionClass = this.constructor !== GlobalStore;
    if (isExtensionClass) return;

    (this as GlobalStore<State, Metadata, ActionsConfig>).initialize();
  }

  protected getMetadata = () => {
    if (!this.asyncStorage?.key) {
      return this.metadata;
    }

    return {
      isAsyncStorageReady: false,
      asyncStorageKey: this.asyncStorage.key,
      ...(this.metadata ?? {}),
    } as StateMeta<Metadata>;
  };

  public static isAsyncStorageAvailable = (
    config: AsyncStorageConfig | null
  ): config is AsyncStorageConfig => {
    return Boolean(config?.key);
  };

  protected _onInitialize = async ({
    setState,
    getState,
    setMetadata,
  }: StoreTools<State, Metadata>): Promise<void> => {
    if (!GlobalStore.isAsyncStorageAvailable(this.asyncStorage)) return;

    // set initial value of the metadata
    setMetadata(
      (metadata) =>
        ({
          ...(metadata ?? {}),
          isAsyncStorageReady: false,
        } as Metadata)
    );

    let restored: State = await getAsyncStorageItem(this.asyncStorage);

    setMetadata(
      (metadata) =>
        ({
          ...(metadata ?? {}),
          isAsyncStorageReady: true,
        } as Metadata)
    );

    if (restored === null) {
      restored = getState();

      setAsyncStorageItem(restored, this.asyncStorage);
    }

    // force update to trigger the subscribers in case the state is the same
    setState(restored, {
      forceUpdate: true,
    });
  };

  protected _onChange = ({ getState }: StoreTools<State, Metadata> & StateChanges<State>): void => {
    if (!GlobalStore.isAsyncStorageAvailable(this.asyncStorage)) return;

    setAsyncStorageItem(getState(), this.asyncStorage);
  };

  /**
   * We set it to null so the instances of the GlobalStoreAbstract can override it.
   */
  protected onInitialize = null as unknown as (args: StoreTools<State, StateMeta<Metadata>>) => void;

  protected onChange = null as unknown as (
    args: StoreTools<State, StateMeta<Metadata>> & StateChanges<State>
  ) => void;

  /**
   * Instead of calling onInitialize and onChange directly, we call the _onInitialize and _onChange
   * This allows the concat the logic of the GlobalStore with the logic of the extension class.
   */
  protected onInit = (parameters: StoreTools<State, StateMeta<Metadata>>) => {
    this._onInitialize?.(parameters as StoreTools<State, Metadata>);
  };

  protected onStateChanged = (args: StoreTools<State, StateMeta<Metadata>> & StateChanges<State>) => {
    this._onChange?.(args as StoreTools<State, Metadata> & StateChanges<State>);
  };
}

export default GlobalStore;
