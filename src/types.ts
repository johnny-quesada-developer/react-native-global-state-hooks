export type {
  StateApi,
  AnyFunction,
  // HookExtensions,
  // ObservableFragment,
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
  StateApi,
  StateChanges,
  SubscriberParameters,
  UseHookOptions,
} from "react-hooks-global-states";
import { AnyFunction, SubscribeToState } from "react-hooks-global-states/types";

export type AsyncStorageConfig<State> = {
  /**
   * @description The key used to store the item in async storage.
   */
  key: string;

  /**
   * @description Validator function to ensure the integrity of the restored state.
   * Receives the restored value and the initial state... If the function returns a value then
   * that value is used as the new state. If it returns `void` (undefined) then the restored state is used
   * and the async storage is updated accordingly.
   *
   * Executes after every initialization from async storage, including after migration.
   *
   * @example
   * ```ts
   * validator: ({ restored, initial }) => {
   *   if (typeof restored !== 'number') {
   *     return initial;
   *   }
   *
   *   return restored;
   * }
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validator: (args: { restored: unknown; initial: any }) => any | void;

  /**
   * @description Error callback invoked when an exception occurs during any persistence phase.
   * Use this to log or report issues without throwing.
   */
  onError?: (error: unknown) => void;

  versioning?: {
    /**
     * @description Current schema version for this item. When the stored version differs,
     * the `migrator` function is invoked to upgrade the stored value.
     * @default -1
     * @example
     * ```ts
     * {
     *   key: 'counter',
     *   version: 1
     * }
     * ```
     */
    version: string | number;

    /**
     * @description Called when a stored value is found with a different version.
     * Receives the raw stored value and must return the upgraded `State`.
     * If and error is thrown during migration, the `onError` callback is invoked
     * and the state falls back to the initial value.
     */

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    migrator: (args: { legacy: unknown; initial: any }) => any;
  };

  /**
   * @description High level overrides of the async storage synchronization
   * Use it if you want to have full control of how the state is stored/retrieved.
   *
   * This disables versioning, migration
   */
  adapter?: {
    /**
     * @description Custom setter for the stored value associated with `key`.
     */
    setItem: (key: string, value: State) => Promise<void>;

    /**
     * @description Custom getter for the stored value associated with `key`.
     * Should return the previously stored value (parsed/decoded to `State`) for that key.
     */
    getItem: (key: string) => Promise<State | null>;
  };
};

/**
 * @description Structure of the item stored in async storage
 */
export type ItemEnvelope<T> = {
  /**
   * @description Actual stored state
   */
  s: T;

  /**
   * @description Version of the stored state
   */
  v?: string | number;
};

// Type to extend the metadata with async storage specific properties
export type BaseMetadata = BaseLibraryMetadata & {
  isAsyncStorageReady?: boolean;
  asyncStorageKey?: string | null;
};

/**
 * The base metadata for async storage always carries the information about the async storage state and
 * the key used to store the state in async storage.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type AsyncMetadata<T> = (keyof T extends never ? {} : T) & BaseMetadata;

export interface StateHook<State, StateMutator, Metadata extends BaseMetadata>
  extends StateApi<State, StateMutator, Metadata> {
  /**
   * @description React hook that provides access to the state, state mutator, and metadata.
   */
  (): Readonly<[state: State, stateMutator: StateMutator, metadata: Metadata]>;

  /**
   * @description React hook that provides a derived state based on the provided selector function.
   */
  <Derivate>(
    selector: (state: State) => Derivate,
    dependencies?: unknown[],
  ): Readonly<[state: Derivate, stateMutator: StateMutator, metadata: Metadata]>;

  /**
   * @description React hook that provides a derived state based on the provided selector function and configuration.
   */
  <Derivate>(
    selector: (state: State) => Derivate,
    config?: UseHookOptions<Derivate, State>,
  ): Readonly<[state: Derivate, stateMutator: StateMutator, metadata: Metadata]>;
}

export type MetadataSetter<Metadata extends BaseMetadata> = (
  setter: Metadata | ((metadata: Metadata) => Metadata),
) => void;

/**
 * API for the actions of the global states
 **/
export type StoreTools<
  State,
  StateMutator = React.Dispatch<React.SetStateAction<State>>,
  Metadata extends BaseMetadata = BaseMetadata,
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
  Metadata extends BaseMetadata,
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

/**
 * @description Resulting type of the action collection configuration
 */
export type ActionCollectionResult<
  State,
  Metadata extends BaseMetadata,
  ActionsConfig extends ActionCollectionConfig<State, Metadata>,
> = {
  [key in keyof ActionsConfig]: {
    (...params: Parameters<ActionsConfig[key]>): ReturnType<ReturnType<ActionsConfig[key]>>;
  };
};

/**
 * Callbacks for the global store lifecycle events
 */
export type GlobalStoreCallbacks<State, StateMutator, Metadata extends BaseMetadata> = {
  /**
   * @description Called when the store is initialized
   */
  onInit?: (args: StoreTools<State, StateMutator, Metadata>) => void;

  /**
   * @description Called when the state has changed
   */
  onStateChanged?: (args: StoreTools<State, StateMutator, Metadata> & StateChanges<State>) => void;

  /**
   * @description Called when a new subscription is created
   */
  onSubscribed?: (
    args: StoreTools<State, StateMutator, Metadata>,
    subscription: SubscriberParameters,
  ) => void;

  /**
   * @description Called to determine whether to prevent a state change
   */
  computePreventStateChange?: (
    args: StoreTools<State, StateMutator, Metadata> & StateChanges<State>,
  ) => boolean;

  /**
   * @description Called when the store is unmounted, only applicable in context stores
   */
  onUnMount?: (store: StoreTools<State, StateMutator, Metadata>) => void;
};

export type MetadataGetter<Metadata extends BaseMetadata> = () => Metadata;

export type ObservableFragment<State, StateMutator, Metadata extends BaseMetadata> = SubscribeToState<State> &
  Pick<
    StateApi<State, StateMutator, Metadata>,
    "getState" | "subscribe" | "createSelectorHook" | "createObservable" | "dispose" | "subscribers"
  >;
