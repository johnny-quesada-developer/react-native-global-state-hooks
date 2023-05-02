/**
 * @param {StateSetter<TState>} setter - set the state
 * @returns {void} result - void
 */
export type StateSetter<TState> = (
  /**
   * @param {StateSetter<TState>} setter - set the state
   * @param {{ forceUpdate?: boolean }} options - Options to be passed to the setter
   * @param {{ forceUpdate?: boolean }} options.forceUpdate - Force the re-render of the subscribers even if the state is the same
   * @returns {void} result - void
   * */
  setter: TState | ((state: TState) => TState),
  /**
   * This parameter indicate whether we should force the re-render of the subscribers even if the state is the same,
   * Do
   */
  {
    forceUpdate,
  }?: {
    /**
     * @deprecated forceUpdate normally should not be used inside components
     * Use this flag just in custom implementations of the global store
     */
    forceUpdate?: boolean;
  }
) => void;

/**
 * @description
 * Type that prevent ts issues with merging never with other types
 */
export type AvoidNever<T> = T extends never | null | undefined ? {} : T;

/**
 * @param {TMetadata} setter - set the metadata
 * @returns {void} result - void
 */
export type MetadataSetter<TMetadata> = (
  /**
   * @param {TMetadata} setter - set the metadata
   * @returns {void} result - void
   * */
  setter: TMetadata | ((metadata: TMetadata) => TMetadata)
) => void;

/**
 * Parameters of the onStateChanged callback function
 * @param {TState} state - the new state
 * @param {TState} previousState - the previous state
 **/
export type StateChanges<TState> = {
  /**
   * The new state
   * */
  state: TState;

  /**
   * The previous state
   * */
  previousState?: TState;
};

/**
 * Callbacks to be passed to the configurations function of the store
 * @template {TState} TState - The state type
 * @template {TMetadata} TMetadata - The metadata type
 * @property {StateSetter<TState>} setMetadata - Set the metadata
 * @property {StateSetter<TState>} setState - Set the state
 * @property {() => TState} getState - Get the state
 * @property {() => TMetadata} getMetadata - Get the metadata
 * @property {ActionCollectionResult<TState, TMetadata>} actions - The actions collection if any
 **/
export type StoreTools<TState = any, TMetadata = any, TActions = any> = {
  /**
   * Set the metadata
   * @param {TMetadata} setter - The metadata or a function that will receive the metadata and return the new metadata
   * @returns {void} result - void
   * */
  setMetadata: MetadataSetter<TMetadata>;

  /**
   * Set the state
   * @param {TState} setter - The state or a function that will receive the state and return the new state
   * @param {{ forceUpdate?: boolean }} options - Options
   * @returns {void} result - void
   * */
  setState: StateSetter<TState>;

  /**
   * Get the state
   * @returns {TState} result - The state
   * */
  getState: StateGetter<TState>;

  /**
   * Get the metadata
   * @returns {TMetadata} result - The metadata
   * */
  getMetadata: () => TMetadata;

  /**
   * Actions of the hook
   */
  actions: TActions;
};

/**
 * Basic contract for the storeActionsConfig configuration
 * @template {TState} TState - The state type
 * @template {TMetadata} TMetadata - The metadata type
 * @property {string} key - The action name
 * @property {(...parameters: unknown[]) => (storeTools: { setMetadata: MetadataSetter<TMetadata>; setState: StateSetter<TState>; getState: () => TState; getMetadata: () => TMetadata; }) => unknown | void} value - The action function
 * @returns {ActionCollectionConfig<TState, TMetadata>} result - The action collection configuration
 */
export interface ActionCollectionConfig<TState, TMetadata = null> {
  [key: string]: (
    ...parameters: any[]
  ) => (storeTools: StoreTools<TState, TMetadata>) => unknown | void;
}

/**
 * This is the actions object returned by the hook when you pass an storeActionsConfig configuration
 * if you pass an storeActionsConfig configuration, the hook will return an object with the actions
 * whatever data manipulation of the state should be executed through the custom actions with as access to the state and metadata
 * @template {TState} TState - The state type
 * @template {TMetadata} TMetadata - The metadata type
 * @template {TStateSetter} TStateSetter - The storeActionsConfig type (optional) - if you pass an storeActionsConfig the hook will return an object with the actions
 *
 * @example
 *
 * const store = new GlobalStore(0, {
 *  increment: () => ({ setState }) => {
 *    setState((state) => state + 1);
 *  },
 *  decrement: () => ({ setState }) => {
 *    setState((state) => state - 1);
 *  },
 * });
 *
 * const [state, actions] = store.getHook();
 *
 * actions.increment();
 * actions.decrement();
 *
 * console.log(state); // 0
 */
export type ActionCollectionResult<
  TState,
  TMetadata,
  TStateSetter extends
    | ActionCollectionConfig<TState, TMetadata>
    | StateSetter<TState> = StateSetter<TState>
> = TStateSetter extends ActionCollectionConfig<TState, TMetadata>
  ? {
      /**
       * @description
       * A new object with will be created with the same keys of the storeActionsConfig object
       */
      [key in keyof TStateSetter]: (
        ...params: Parameters<TStateSetter[key]>
      ) => ReturnType<ReturnType<TStateSetter[key]>>;
    }
  : null;

/**
 * Common parameters of the store configuration callback functions
 * @param {StateSetter<TState>} setState - add a new value to the state
 * @param {() => TState} getState - get the current state
 * @param {MetadataSetter<TMetadata>} setMetadata - add a new value to the metadata
 * @param {() => TMetadata} getMetadata - get the current metadata
 * @param {ActionCollectionResult<TState, ActionCollectionConfig<TState, TMetadata>> | null} actions - the actions object returned by the hook when you pass an storeActionsConfig configuration otherwise null
 * @template {TState} TState - The state type
 * @template {TMetadata} TMetadata - The metadata type
 * @template {TStateSetter} TStateSetter - The storeActionsConfig type (optional) - if you pass an storeActionsConfig the hook will return an object with the actions
 * @template {ActionCollectionResult<TState, TStateSetter>} TStateSetter - the result of the API (optional) - if you don't pass an API as a parameter, you can pass null
 * */
export type StateConfigCallbackParam<
  TState,
  TMetadata,
  TStateSetter extends
    | ActionCollectionConfig<TState, TMetadata>
    | StateSetter<TState> = StateSetter<TState>
> = {
  actions: TStateSetter extends ActionCollectionConfig<TState, TMetadata>
    ? ActionCollectionResult<TState, TMetadata, TStateSetter>
    : null;
} & StoreTools<TState, TMetadata>;

/**
 * Parameters of the onStateChanged callback function
 * @template {TState} TState - The state type
 * @template {TMetadata} TMetadata - The metadata type
 * @template {TStateSetter} TStateSetter - The storeActionsConfig type (optional) - if you pass an storeActionsConfig the hook will return an object with the actions
 */
export type StateChangesParam<
  TState,
  TMetadata,
  TStateSetter extends
    | ActionCollectionConfig<TState, TMetadata>
    | StateSetter<TState> = StateSetter<TState>
> = StateConfigCallbackParam<TState, TMetadata, TStateSetter> &
  StateChanges<TState>;

/**
 * Configuration of the store (optional) - if you don't need to use the store configuration you don't need to pass this parameter
 * @param {StateConfigCallbackParam<TState, TMetadata> => void} onInit - callback function called when the store is initialized
 * @param {StateConfigCallbackParam<TState, TMetadata> => void} onSubscribed - callback function called every time a component is subscribed to the store
 * @param {StateChangesParam<TState, TMetadata> => boolean} computePreventStateChange - callback function called every time the state is changed and it allows you to prevent the state change
 * @param {StateChangesParam<TState, TMetadata> => void} onStateChanged - callback function called every time the state is changed
 * @template TState - the type of the state
 * @template TMetadata - the type of the metadata (optional) - if you don't pass an metadata as a parameter, you can pass null
 * @template {ActionCollectionConfig<TState,TMetadata> | null} TStateSetter - the configuration of the API (optional) - if you don't pass an API as a parameter, you can pass null
 * */
export type GlobalStoreConfig<
  TState,
  TMetadata,
  TStateSetter extends
    | ActionCollectionConfig<TState, TMetadata>
    | StateSetter<TState> = StateSetter<TState>
> = {
  /**
   * @param {StateConfigCallbackParam<TState, TMetadata> => void} metadata - the initial value of the metadata
   * */
  metadata?: TMetadata;

  /**
   * @param {StateConfigCallbackParam<TState, TMetadata> => void} onInit - callback function called when the store is initialized
   * @returns {void} result - void
   * */
  onInit?: (
    parameters: StateConfigCallbackParam<TState, TMetadata, TStateSetter>
  ) => void;

  /**
   * @param {StateChangesParam<TState, TMetadata> => void} onStateChanged - callback function called every time the state is changed
   * @returns {void} result - void
   */
  onStateChanged?: (
    parameters: StateChangesParam<TState, TMetadata, TStateSetter>
  ) => void;

  /**
   * @param {StateConfigCallbackParam<TState, TMetadata> => void} onSubscribed - callback function called every time a component is subscribed to the store
   * @returns {void} result - void
   */
  onSubscribed?: (
    parameters: StateConfigCallbackParam<TState, TMetadata, TStateSetter>
  ) => void;

  /**
   * @param {StateChangesParam<TState, TMetadata> => boolean} computePreventStateChange - callback function called every time the state is about to change and it allows you to prevent the state change
   * @returns {boolean} result - true if you want to prevent the state change, false otherwise
   */
  computePreventStateChange?: (
    parameters: StateChangesParam<TState, TMetadata, TStateSetter>
  ) => boolean;
} | null;

export type UseHookConfig<TState> = {
  /**
   * The callback to execute when the state is changed to check if the same really changed
   * If the function is not provided the derived state will perform a shallow comparison
   */
  isEqual?: (current: TState, next: TState) => boolean;
};

/**
 * Callback function to unsubscribe from the store
 */
export type UnsubscribeCallback = () => void;

/**
 * Configuration of the subscribe callbacks
 */
export type SubscribeCallbackConfig<TState> = UseHookConfig<TState> & {
  /**
   * By default the callback is executed immediately after the subscription
   */
  skipFirst?: boolean;
};

/**
 * Callback function to subscribe to the store changes
 */
export type SubscribeCallback<TState> = (state: TState) => void;

/**
 * Callback function to subscribe to a portion of the store changes
 * @template {TState} TState - The state type
 * @template {TDerivate} TDerivate - The derived state type
 * @param {SubscribeSelectorCallback<TState, TDerivate>} selector - the selector function to derive the state
 * @param {SubscribeCallback<TDerivate>} callback - the callback to execute when the derived state is changed
 * @param {SubscribeCallbackConfig<TDerivate>} config - the configuration object
 * @returns {void} result - void
 */
export type SubscribeSelectorCallback<TState, TDerivate> = (
  /**
   * The selector function to derive the state
   * @param {TState} state - the current state of the store
   * @returns {TDerivate} result - the derived state
   * */
  selector: (state: TState) => TDerivate,

  /**
   * The callback to execute when the derived state is changed
   */
  callback: SubscribeCallback<TDerivate>,

  /**
   * The configuration object
   * In the configuration object you can specify a custom compare function to check if the state is changed
   */
  config?: SubscribeCallbackConfig<TDerivate>
) => void;

/**
 * Use this function to subscribe to the store changes
 */
export type SubscribeMethod<TState> = (
  /**
   * This callback will be executed every time the state is changed
   */
  callback: SubscribeCallback<TState>,

  /**
   * The configuration object
   * In the configuration object you can specify a custom compare function to check if the state is changed
   */
  config?: SubscribeCallbackConfig<TState>
) => void;

export type SubscribeSelectorMethod<TState> = <TDerivate>(
  /**
   * The selector function to derive the state
   * @param {TState} state - the current state of the store
   * @returns {TDerivate} result - the derived state
   * */
  selector: (state: TState) => TDerivate,

  /**
   * This callback will be executed every time the state is changed
   */
  callback: SubscribeCallback<TDerivate>,

  /**
   * The configuration object
   * In the configuration object you can specify a custom compare function to check if the state is changed
   */
  config?: SubscribeCallbackConfig<TDerivate>
) => void;

export type SubscriberCallback<TState> = ({
  subscribe,
}: {
  /**
   * Current state of the store
   */
  state: TState;

  /**
   * Allow you to subscribe to the store changes
   */
  subscribe: SubscribeMethod<TState>;

  /**
   * Allow to select a derived state from the store
   */
  subscribeSelector: SubscribeSelectorMethod<TState>;
}) => void;

/**
 * Callback function to get the current state of the store or to subscribe to the store changes
 * @template TState - the type of the state
 * @param {SubscriberCallback<TState> | null} callback - the callback function to subscribe to the store changes (optional)
 * use the methods subscribe and subscribeSelect to subscribe to the store changes
 * if you don't pass a callback function the hook will return the current state of the store
 * @returns {UnsubscribeCallback | TState} result - the state or the unsubscribe callback if you pass a callback function
 */
export type StateGetter<TState> = <
  TCallback extends SubscriberCallback<TState> | null = null
>(
  /**
   * @param {SubscriberCallback<TState> | null} callback - the callback function to subscribe to the store changes (optional)
   * use the methods subscribe and subscribeSelect to subscribe to the store changes
   */
  callback?: TCallback
) => TCallback extends null | never | undefined ? TState : UnsubscribeCallback;
