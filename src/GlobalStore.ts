import type {
  ActionCollectionConfig,
  GlobalStoreCallbacks,
  StateChanges,
  StoreTools,
} from "react-hooks-global-states/types";
import type {
  ActionCollectionResult,
  AsyncStorageConfig,
  AsyncMetadata,
  BaseMetadata,
  AnyFunction,
} from "./types";

import { GlobalStoreAbstract } from "react-hooks-global-states/GlobalStoreAbstract";
import { getAsyncStorageItem } from "./getAsyncStorageItem";
import { setAsyncStorageItem } from "./setAsyncStorageItem";

/**
 * React Native Global Store with Async Storage support
 */
export class GlobalStore<
  State,
  Metadata extends AsyncMetadata,
  ActionsConfig extends ActionCollectionConfig<State, Metadata> | undefined | unknown,
  PublicStateMutator = keyof ActionsConfig extends never | undefined
    ? React.Dispatch<React.SetStateAction<State>>
    : ActionCollectionResult<State, Metadata, NonNullable<ActionsConfig>>,
> extends GlobalStoreAbstract<State, BaseMetadata<Metadata>, ActionsConfig> {
  public asyncStorage: AsyncStorageConfig | null = null;

  constructor(state: State);

  constructor(
    state: State,
    args: {
      metadata?: Metadata;
      callbacks?: GlobalStoreCallbacks<
        State,
        PublicStateMutator extends AnyFunction ? null : PublicStateMutator,
        Metadata
      >;
      actions?: ActionsConfig;
      name?: string;
      asyncStorage?: AsyncStorageConfig;
    },
  );

  constructor(
    state: State,
    args: {
      metadata?: Metadata;
      callbacks?: GlobalStoreCallbacks<State, PublicStateMutator, Metadata>;
      actions?: ActionsConfig;
      name?: string;
      asyncStorage?: AsyncStorageConfig;
    } = { metadata: {} as Metadata },
  ) {
    // @ts-expect-error TS2345
    super(state, args);

    this.asyncStorage = args.asyncStorage ?? null;

    this.setMetadata(
      (metadata) =>
        ({
          ...(metadata ?? {}),
          isAsyncStorageReady: false,
          asyncStorageKey: this.asyncStorage?.key ?? null,
        }) as BaseMetadata<Metadata>,
    );

    const isExtensionClass = this.constructor !== GlobalStore;
    if (isExtensionClass) return;

    (this as GlobalStore<State, Metadata, ActionsConfig>).initialize();
  }

  public getMetadata = () => {
    if (!this.asyncStorage?.key) {
      return this.metadata;
    }

    return {
      isAsyncStorageReady: false,
      asyncStorageKey: this.asyncStorage.key,
      ...(this.metadata ?? {}),
    } as BaseMetadata<Metadata>;
  };

  public static isAsyncStorageAvailable = (
    config: AsyncStorageConfig | null,
  ): config is AsyncStorageConfig => {
    return Boolean(config?.key);
  };

  protected _onInitialize = async ({
    setState,
    getState,
    setMetadata,
  }: StoreTools<State, PublicStateMutator, Metadata>): Promise<void> => {
    if (!GlobalStore.isAsyncStorageAvailable(this.asyncStorage)) return;

    // set initial value of the metadata
    setMetadata(
      (metadata) =>
        ({
          ...(metadata ?? {}),
          isAsyncStorageReady: false,
        }) as Metadata,
    );

    let restored: State = await getAsyncStorageItem(this.asyncStorage);

    setMetadata(
      (metadata) =>
        ({
          ...(metadata ?? {}),
          isAsyncStorageReady: true,
        }) as Metadata,
    );

    if (restored === null) {
      restored = getState();

      setAsyncStorageItem(restored, this.asyncStorage);
    }

    // force update to trigger the subscribers in case the state is the same
    // @ts-expect-error - this parameter exists but is hidden from the public API
    setState(restored, {
      forceUpdate: true,
    });
  };

  protected _onChange = ({
    getState,
  }: StoreTools<State, PublicStateMutator, Metadata> & StateChanges<State>): void => {
    if (!GlobalStore.isAsyncStorageAvailable(this.asyncStorage)) return;

    setAsyncStorageItem(getState(), this.asyncStorage);
  };

  /**
   * We set it to null so the instances of the GlobalStoreAbstract can override it.
   */
  // @ts-expect-error TS2345
  protected onInitialize = null as unknown as (args: StoreTools<State, PublicStateMutator, Metadata>) => void;

  // @ts-expect-error TS2345
  protected onChange = null as unknown as (
    args: StoreTools<State, PublicStateMutator, Metadata> & StateChanges<State>,
  ) => void;

  /**
   * Instead of calling onInitialize and onChange directly, we call the _onInitialize and _onChange
   * This allows the concat the logic of the GlobalStore with the logic of the extension class.
   */
  // @ts-expect-error TS2345
  protected onInit = (parameters: StoreTools<State, PublicStateMutator, Metadata>) => {
    this._onInitialize?.(parameters);
  };

  // @ts-expect-error TS2345
  protected onStateChanged = (
    args: StoreTools<State, PublicStateMutator, Metadata> & StateChanges<State>,
  ) => {
    this._onChange?.(args);
  };
}

export default GlobalStore;
