export type {
  StateApi,
  AnyFunction,
  // HookExtensions,
  ObservableFragment,
  // MetadataSetter,
  StateChanges,
  // StoreTools,
  // ActionCollectionResult,
  // GlobalStoreCallbacks,
  UseHookOptions,
  UnsubscribeCallback,
  SubscribeCallbackConfig,
  SubscribeCallback,
  // BaseMetadata,
  // MetadataGetter,
  // CustomGlobalHookBuilderParams,
  SelectorCallback,
  SubscriberParameters,
  SubscriptionCallback,
  // ActionCollectionConfig,
} from "react-hooks-global-states/types";

import React from "react";
import type {
  BaseMetadata as BaseLibraryMetadata,
  ObservableFragment,
  StateChanges,
  UseHookOptions,
} from "react-hooks-global-states";
import { AnyFunction, SubscribeToState } from "react-hooks-global-states/types";

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

// Type to extend the metadata with async storage specific properties
export type AsyncMetadata = BaseLibraryMetadata & {
  isAsyncStorageReady?: boolean;
  asyncStorageKey?: string | null;
};

/**
 * The base metadata for async storage always carries the information about the async storage state and
 * the key used to store the state in async storage.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type BaseMetadata<T> = (keyof T extends never ? {} : T) & AsyncMetadata;

export type HookExtensions<State, StateMutator, Metadata extends AsyncMetadata> = {
  /**
   * @description Return the state controls of the hook
   * This selectors includes:
   * - stateRetriever: a function to get the current state or subscribe a callback to the state changes
   * - stateMutator: a function to set the state or a collection of actions if you pass an storeActionsConfig configuration
   * - metadataRetriever: a function to get the metadata of the global state
   */
  stateControls: () => Readonly<
    [retriever: () => State, mutator: StateMutator, metadata: MetadataGetter<Metadata>]
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
    args?: Omit<UseHookOptions<Derivate, State>, "dependencies"> & {
      name?: string;
    },
  ) => StateHook<Derivate, StateMutator, Metadata>;

  createObservable: <Fragment>(
    this: StateHook<State, StateMutator, Metadata>,
    mainSelector: (state: State) => Fragment,
    args?: {
      isEqual?: (current: Fragment, next: Fragment) => boolean;
      isEqualRoot?: (current: State, next: State) => boolean;
      name?: string;
    },
  ) => ObservableFragment<Fragment, StateMutator, Metadata>;
};

export interface StateHook<State, StateMutator, Metadata extends AsyncMetadata>
  extends HookExtensions<State, StateMutator, Metadata> {
  (): Readonly<[state: State, stateMutator: StateMutator, metadata: Metadata]> &
    HookExtensions<State, StateMutator, Metadata>;

  <Derivate>(
    selector: (state: State) => Derivate,
    config?: UseHookOptions<Derivate, State>,
  ): Readonly<[state: Derivate, stateMutator: StateMutator, metadata: Metadata]> &
    HookExtensions<Derivate, StateMutator, Metadata>;
}

export type MetadataSetter<Metadata extends AsyncMetadata> = (
  setter: Metadata | ((metadata: Metadata) => Metadata),
) => void;

/**
 * API for the actions of the global states
 **/
export type StoreTools<
  State,
  StateMutator = React.Dispatch<React.SetStateAction<State>>,
  Metadata extends AsyncMetadata = AsyncMetadata,
> = {
  /**
   * The actions available for the global state
   */
  actions: StateMutator extends AnyFunction ? null : StateMutator;
  /**
   * @description Metadata associated with the global state
   */
  getMetadata: () => Metadata;
  /**
   * @description Current state value
   */
  getState: () => State;
  /**
   * @description Sets the metadata value
   */
  setMetadata: MetadataSetter<Metadata>;
  /**
   * @description Function to set the state value
   */
  setState: React.Dispatch<React.SetStateAction<State>>;
  /**
   * @description Subscribe to the state changes
   * You can subscribe to the whole state or to a fragment of the state by passing a selector as first parameter,
   * this can be used in non react environments to listen to the state changes
   *
   * @example
   * ```ts
   * const unsubscribe = storeTools.subscribe((state) => {
   *   console.log('State changed:', state);
   * });
   *
   * // To unsubscribe later
   * unsubscribe();
   * ```
   */
  subscribe: SubscribeToState<State>;
};

/**
 * contract for the storeActionsConfig configuration
 */
export interface ActionCollectionConfig<
  State,
  Metadata extends AsyncMetadata,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ThisAPI = Record<string, (...parameters: any[]) => unknown>,
> {
  readonly [key: string]: {
    (
      this: ThisAPI,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...parameters: any[]
    ): (
      this: ThisAPI,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      storeTools: StoreTools<State, Record<string, (...parameters: any[]) => unknown | void>, Metadata>,
    ) => unknown | void;
  };
}

export type ActionCollectionResult<
  State,
  Metadata extends AsyncMetadata,
  ActionsConfig extends ActionCollectionConfig<State, Metadata>,
> = {
  [key in keyof ActionsConfig]: {
    (...params: Parameters<ActionsConfig[key]>): ReturnType<ReturnType<ActionsConfig[key]>>;
  };
};

export type GlobalStoreCallbacks<State, Metadata extends AsyncMetadata> = {
  onInit?: (args: StoreTools<State, Metadata>) => void;
  onStateChanged?: (args: StoreTools<State, Metadata> & StateChanges<State>) => void;
  onSubscribed?: (args: StoreTools<State, Metadata>) => void;
  computePreventStateChange?: (args: StoreTools<State, Metadata> & StateChanges<State>) => boolean;
};

export type MetadataGetter<Metadata extends AsyncMetadata> = () => Metadata;
