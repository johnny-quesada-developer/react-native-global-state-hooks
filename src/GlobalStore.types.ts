/**
 * @param {StateSetter<TState>} setter - add a new value to the state
 * @returns {void} result - void
 */
export type StateSetter<TState> = (
  setter: TState | ((state: TState) => TState)
) => void;

export type ActionConfigCallbackParam<TState = unknown, TMetadata = null> = {
  setMetadata: StateSetter<TMetadata>;
  setState: StateSetter<TState>;
  getState: () => TState;
  getMetadata: () => TMetadata;
  actions: ActionCollectionResult<
    TState,
    TMetadata,
    ActionCollectionConfig<TState, TMetadata>
  >;
};

/**
 * This is the structure required by the actions callback into the storeActionsConfig object
 */
export type ActionConfigCallback<TState, TMetadata> = (
  ...parameters: any[]
) => (parameters: ActionConfigCallbackParam<TState, TMetadata>) => unknown;

/**
 * Basic contract for the storeActionsConfig configuration
 */
export interface ActionCollectionConfig<TState, TMetadata> {
  [key: string]: (
    ...params: any[]
  ) => (parameters: ActionConfigCallbackParam<TState, TMetadata>) => unknown;
}

/**
 * This is the actions object returned by the hook when you pass an storeActionsConfig configuration
 * whatever data manipulation of the state should be executed through the custom actions with as access to the state and metadata
 */
export type ActionCollectionResult<
  TState,
  TMetadata,
  TStoreActionsConfig extends ActionCollectionConfig<TState, TMetadata> | null
> = {
  [key in keyof TStoreActionsConfig]: (
    ...params: Parameters<
      TStoreActionsConfig[key] extends ActionConfigCallback<TState, TMetadata>
        ? TStoreActionsConfig[key]
        : never
    >
  ) => ReturnType<
    ReturnType<
      TStoreActionsConfig[key] extends (
        ...params: any[]
      ) => (parameters: ActionConfigCallbackParam<TState, TMetadata>) => unknown
        ? TStoreActionsConfig[key]
        : never
    >
  >;
};

/**
 * This is the structure returned by the orchestrator of the state which could be a function or an object with specific actions
 * if you pass an storeActionsConfig configuration, you will get an object with the actions
 * if you don't pass an storeActionsConfig configuration, you will get a function to set the state
 * @template TState - the type of the state
 * @template TMetadata - the type of the metadata (optional) - if you don't pass an metadata as a parameter, you can pass null
 * @template {ActionCollectionConfig<TState,TMetadata> | null} TStoreActionsConfig - the configuration of the API (optional) - if you don't pass an API as a parameter, you can pass null
 * @template {ActionCollectionResult<TState,TStoreActionsConfig>} TStoreActions - the result of the API (optional) - if you don't pass an API as a parameter, you can pass null
 * @returns {StateOrchestrator<TState, TMetadata, TStoreActionsConfig, TStoreActions>} - the orchestrator of the state
 * */
export type StateOrchestrator<
  TState,
  TMetadata,
  TStoreActionsConfig extends ActionCollectionConfig<TState, TMetadata> | null,
  TStoreActions extends ActionCollectionResult<
    TState,
    TMetadata,
    TStoreActionsConfig
  > | null = TStoreActionsConfig extends null
    ? null
    : ActionCollectionResult<TState, TMetadata, TStoreActionsConfig>
> = TStoreActions extends null
  ? StateSetter<TState>
  : TStoreActionsConfig extends ActionCollectionConfig<TState, TMetadata>
  ? TStoreActions extends ActionCollectionResult<
      TState,
      TMetadata,
      TStoreActionsConfig
    >
    ? TStoreActions
    : StateSetter<TState>
  : StateSetter<TState>;

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
 * Common parameters of the store configuration callback functions
 * @param {StateSetter<TState>} setState - add a new value to the state
 * @param {StateSetter<TMetadata>} setMetadata - add a new value to the metadata
 * @param {ActionCollectionResult<TState, ActionCollectionConfig<TState, TMetadata>> | null} actions - the actions object returned by the hook when you pass an storeActionsConfig configuration
 * if you don't pass an storeActionsConfig configuration, you will get a function to set the state
 * @param {() => TMetadata} getMetadata - get the current metadata
 * */
export type StateConfigCallbackParam<TState, TMetadata> = {
  setState: StateSetter<TState>;
  setMetadata: StateSetter<TMetadata>;
  actions: ActionCollectionResult<
    TState,
    TMetadata,
    ActionCollectionConfig<TState, TMetadata>
  > | null;
  getMetadata: () => TMetadata;
};

export type StateChangesParam<TState, TMetadata> = StateConfigCallbackParam<
  TState,
  TMetadata
> &
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
 * */
export type GlobalStoreConfig<TState, TMetadata> = {
  metadata?: TMetadata;
  onInit?: (params: StateConfigCallbackParam<TState, TMetadata>) => void;
  onSubscribed?: (params: StateConfigCallbackParam<TState, TMetadata>) => void;
  computePreventStateChange?: (
    params: StateChangesParam<TState, TMetadata>
  ) => boolean;
  onStateChanged?: (params: StateChangesParam<TState, TMetadata>) => void;
};
