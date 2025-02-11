export type {
  StateSetter,
  // HookExtensions,
  ObservableFragment,
  // MetadataSetter,
  StateChanges,
  // StoreTools,
  // ActionCollectionResult,
  // GlobalStoreCallbacks,
  UseHookConfig,
  UnsubscribeCallback,
  SubscribeCallbackConfig,
  SubscribeCallback,
  StateGetter,
  // BaseMetadata,
  // MetadataGetter,
  // CustomGlobalHookBuilderParams,
  SelectorCallback,
  SubscriberParameters,
  SubscriptionCallback,
  // ActionCollectionConfig,
} from "react-hooks-global-states/types";

import type {
  BaseMetadata as MetadataBase,
  ObservableFragment,
  StateChanges,
  StateGetter,
  StateSetter,
  UseHookConfig,
} from "react-hooks-global-states";

export type AsyncStorageConfig = {
  key: string | (() => string);

  /**
   * The function used to encrypt the async storage, it can be a custom function or a boolean value (true = atob)
   */
  encrypt?: boolean | ((value: string) => string);

  /**
   * The function used to decrypt the async storage, it can be a custom function or a boolean value (true = atob)
   */
  decrypt?: boolean | ((value: string) => string);
};

export type BaseMetadata = MetadataBase & {
  isAsyncStorageReady?: boolean;
  asyncStorageKey?: string | null;
};

export type StateMeta<T> = (keyof T extends never ? {} : T) & BaseMetadata;

export type HookExtensions<State, StateMutator, Metadata extends BaseMetadata | unknown> = {
  /**
   * @description Return the state controls of the hook
   * This selectors includes:
   * - stateRetriever: a function to get the current state or subscribe a callback to the state changes
   * - stateMutator: a function to set the state or a collection of actions if you pass an storeActionsConfig configuration
   * - metadataRetriever: a function to get the metadata of the global state
   */
  stateControls: () => Readonly<
    [retriever: StateGetter<State>, mutator: StateMutator, metadata: MetadataGetter<Metadata>]
  >;

  /***
   * @description Creates a new hooks that returns the result of the selector passed as a parameter
   * Your can create selector hooks of other selectors hooks and extract as many derived states as or fragments of the state as you want
   * The selector hook will be evaluated only if the result of the selector changes and the equality function returns false
   * you can customize the equality function by passing the isEqualRoot and isEqual parameters
   */
  createSelectorHook: <Derivate>(
    this: StateHook<State, StateMutator, Metadata>,
    selector: (state: State) => Derivate,
    args?: Omit<UseHookConfig<Derivate, State>, "dependencies"> & {
      name?: string;
    }
  ) => StateHook<Derivate, StateMutator, Metadata>;

  createObservable: <Fragment>(
    this: StateHook<State, StateMutator, Metadata>,
    mainSelector: (state: State) => Fragment,
    args?: {
      isEqual?: (current: Fragment, next: Fragment) => boolean;
      isEqualRoot?: (current: State, next: State) => boolean;
      name?: string;
    }
  ) => ObservableFragment<Fragment>;
};

export interface StateHook<State, StateMutator, Metadata extends BaseMetadata | unknown>
  extends HookExtensions<State, StateMutator, Metadata> {
  (): Readonly<[state: State, stateMutator: StateMutator, metadata: Metadata]> &
    HookExtensions<State, StateMutator, Metadata>;

  <Derivate>(selector: (state: State) => Derivate, config?: UseHookConfig<Derivate, State>): Readonly<
    [state: Derivate, stateMutator: StateMutator, metadata: Metadata]
  > &
    HookExtensions<Derivate, StateMutator, Metadata>;
}

export type MetadataSetter<Metadata extends BaseMetadata | unknown> = (
  setter: Metadata | ((metadata: Metadata) => Metadata)
) => void;

export type StoreTools<
  State,
  Metadata extends BaseMetadata | unknown = BaseMetadata,
  Actions extends undefined | unknown | Record<string, (...args: any[]) => any> = unknown
> = {
  setMetadata: MetadataSetter<Metadata>;
  setState: StateSetter<State>;
  getState: StateGetter<State>;
  getMetadata: () => Metadata;
  actions: Actions;
};

export interface ActionCollectionConfig<
  State,
  Metadata extends BaseMetadata | unknown,
  ThisAPI = Record<string, (...parameters: any[]) => unknown>
> {
  readonly [key: string]: {
    (this: ThisAPI, ...parameters: any[]): (
      this: ThisAPI,
      storeTools: StoreTools<State, Metadata, Record<string, (...parameters: any[]) => unknown | void>>
    ) => unknown | void;
  };
}

export type ActionCollectionResult<
  State,
  Metadata extends BaseMetadata | unknown,
  ActionsConfig extends ActionCollectionConfig<State, Metadata>
> = {
  [key in keyof ActionsConfig]: {
    (...params: Parameters<ActionsConfig[key]>): ReturnType<ReturnType<ActionsConfig[key]>>;
  };
};

export type GlobalStoreCallbacks<State, Metadata extends BaseMetadata | unknown> = {
  onInit?: (args: StoreTools<State, Metadata>) => void;
  onStateChanged?: (args: StoreTools<State, Metadata> & StateChanges<State>) => void;
  onSubscribed?: (args: StoreTools<State, Metadata>) => void;
  computePreventStateChange?: (args: StoreTools<State, Metadata> & StateChanges<State>) => boolean;
};

export type MetadataGetter<Metadata extends BaseMetadata | unknown> = () => Metadata;

export type CustomGlobalHookBuilderParams<
  TCustomConfig extends BaseMetadata | unknown,
  Metadata extends BaseMetadata | unknown
> = {
  onInitialize?: (args: StoreTools<unknown, Metadata, unknown>, config: TCustomConfig | undefined) => void;
  onChange?: (
    args: StoreTools<unknown, Metadata, unknown> & StateChanges<unknown>,
    config: TCustomConfig | undefined
  ) => void;
};
