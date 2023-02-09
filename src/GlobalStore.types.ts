/**
 * @param {StateSetter<TState>} setter - add a new state to an existing state
 * @returns {void} result - void
 */
export type StateSetter<TState> = (
  setter: TState | ((state: TState) => TState)
) => void;

/**
 * Parameters of the onStateChanged callback function
 * @param {TState} state - the new state
 * @param {TState} previousState - the previous state
 **/
export type StateChanges<TState> = {
  state: TState;
  previousState?: TState;
};

/**
 * Callbacks to be passed to the configurating function of the store
 * @template {TState} TState - The state type
 * @template {TMetadata} TMetadata - The metadata type
 * @property {StateSetter<TState>} setMetadata - Set the metadata
 * @property {StateSetter<TState>} setState - Set the state
 * @property {() => TState} getState - Get the state
 * @property {() => TMetadata} getMetadata - Get the metadata
 **/
export type StoreTools<TState, TMetadata> = {
  setMetadata: StateSetter<TMetadata>;
  setState: StateSetter<TState>;
  getState: () => TState;
  getMetadata: () => TMetadata;
};

/**
 * Basic contract for the storeActionsConfig configuration
 * @template {TState} TState - The state type
 * @template {TMetadata} TMetadata - The metadata type
 * @property {string} key - The action name
 * @property {(...parameters: unknown[]) => (storeTools: { setMetadata: StateSetter<TMetadata>; setState: StateSetter<TState>; getState: () => TState; getMetadata: () => TMetadata; }) => unknown | void} value - The action function
 * @returns {ActionCollectionConfig<TState, TMetadata>} result - The action collection configuration
 */
export interface ActionCollectionConfig<TState, TMetadata> {
  [key: string]: // function
  | {
        (...parameters: unknown[]): (storeTools: {
          setMetadata: StateSetter<TMetadata>;
          setState: StateSetter<TState>;
          getState: () => TState;
          getMetadata: () => TMetadata;
        }) => unknown | void;
      }
    //arrow function
    | ((
        ...parameters: unknown[]
      ) => (storeTools: {
        setMetadata: StateSetter<TMetadata>;
        setState: StateSetter<TState>;
        getState: () => TState;
        getMetadata: () => TMetadata;
      }) => unknown | void);
}

/**
 * This is the actions object returned by the hook when you pass an storeActionsConfig configuration
 * if you pass an storeActionsConfig configuration, the hook will return an object with the actions
 * whatever data manipulation of the state should be executed through the custom actions with as access to the state and metadata
 * @template {TState} TState - The state type
 * @template {TMetadata} TMetadata - The metadata type
 * @template {TStoreActionsConfig} TStoreActionsConfig - The storeActionsConfig type (optional) - if you pass an storeActionsConfig the hook will return an object with the actions
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
  TStoreActionsConfig extends ActionCollectionConfig<TState, TMetadata>
> = {
  [key in keyof TStoreActionsConfig]: (
    ...params: Parameters<TStoreActionsConfig[key]>
  ) => ReturnType<ReturnType<TStoreActionsConfig[key]>>;
};

/**
 * Common parameters of the store configuration callback functions
 * @param {StateSetter<TState>} setState - add a new value to the state
 * @param {() => TState} getState - get the current state
 * @param {StateSetter<TMetadata>} setMetadata - add a new value to the metadata
 * @param {() => TMetadata} getMetadata - get the current metadata
 * @param {ActionCollectionResult<TState, ActionCollectionConfig<TState, TMetadata>> | null} actions - the actions object returned by the hook when you pass an storeActionsConfig configuration otherwise null
 * @template {TState} TState - The state type
 * @template {TMetadata} TMetadata - The metadata type
 * @template {TStoreActionsConfig} TStoreActionsConfig - The storeActionsConfig type (optional) - if you pass an storeActionsConfig the hook will return an object with the actions
 * @template {ActionCollectionResult<TState, TStoreActionsConfig>} TStoreActions - the result of the API (optional) - if you don't pass an API as a parameter, you can pass null
 * */
export type StateConfigCallbackParam<
  TState,
  TMetadata,
  TStoreActionsConfig extends ActionCollectionConfig<
    TState,
    TMetadata
  > | null = null,
  TStoreActions extends ActionCollectionResult<
    TState,
    TMetadata,
    NonNullable<TStoreActionsConfig>
  > | null = TStoreActionsConfig extends null
    ? null
    : ActionCollectionResult<
        TState,
        TMetadata,
        NonNullable<TStoreActionsConfig>
      >
> = {
  actions: TStoreActions;
} & StoreTools<TState, TMetadata>;

/**
 * Parameters of the onStateChanged callback function
 * @template {TState} TState - The state type
 * @template {TMetadata} TMetadata - The metadata type
 * @template {TStoreActionsConfig} TStoreActionsConfig - The storeActionsConfig type (optional) - if you pass an storeActionsConfig the hook will return an object with the actions
 */
export type StateChangesParam<
  TState,
  TMetadata,
  TStoreActions extends ActionCollectionConfig<TState, TMetadata> | null
> = StateConfigCallbackParam<TState, TMetadata, TStoreActions> &
  StateChanges<TState>;

/**
 * Configuration of the store (optional) - if you don't need to use the store configuration you don't need to pass this parameter
 * @param {TMetadata} metadata - the initial metadata
 * @param {StateConfigCallbackParam<TState, TMetadata> => void} onInit - callback function called when the store is initialized
 * @param {StateConfigCallbackParam<TState, TMetadata> => void} onSubscribed - callback function called every time a component is subscribed to the store
 * @param {StateChangesParam<TState, TMetadata> => boolean} computePreventStateChange - callback function called every time the state is changed and it allows you to prevent the state change
 * @param {StateChangesParam<TState, TMetadata> => void} onStateChanged - callback function called every time the state is changed
 * @template TState - the type of the state
 * @template TMetadata - the type of the metadata (optional) - if you don't pass an metadata as a parameter, you can pass null
 * @template {ActionCollectionConfig<TState,TMetadata> | null} TStoreActionsConfig - the configuration of the API (optional) - if you don't pass an API as a parameter, you can pass null
 * */
export type GlobalStoreConfig<
  TState,
  TMetadata,
  TStoreActions extends ActionCollectionConfig<TState, TMetadata>
> = {
  metadata?: TMetadata;

  onInit?: (
    params: StateConfigCallbackParam<TState, TMetadata, TStoreActions>
  ) => void;

  onStateChanged?: (
    params: StateChangesParam<TState, TMetadata, TStoreActions>
  ) => void;

  onSubscribed?: (
    params: StateConfigCallbackParam<TState, TMetadata, TStoreActions>
  ) => void;

  computePreventStateChange?: (
    params: StateChangesParam<TState, TMetadata, TStoreActions>
  ) => boolean;
};
