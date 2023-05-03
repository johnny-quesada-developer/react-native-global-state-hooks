import {
  ActionCollectionConfig,
  StateConfigCallbackParam,
  StateChangesParam,
  StateSetter,
  ActionCollectionResult,
  UseHookConfig,
  AvoidNever,
  GlobalStoreConfig,
  UnsubscribeCallback,
  Subscribe,
  StateHook,
  StoreTools,
  StateGetter,
  SubscribeCallback,
} from "GlobalStore.types";
import { GlobalStore } from "./GlobalStore";

/**
 * Creates a global hook that can be used to access the state and actions across the application
 * @param {TState} state - The initial state
 * @param {{ config?: GlobalStoreConfig<TState, TMetadata, TStateSetter>; actionsConfig?: TStateSetter | null }} parameters - The configuration object (optional) (default: null)
 * @param {GlobalStoreConfig<TState, TMetadata, TStateSetter>} parameters.config - The configuration object
 * @param {TStateSetter | null} parameters.actionsConfig - The setter configuration object (optional) (default: null)
 * @returns {} [HOOK, DECOUPLED_GETTER, DECOUPLED_SETTER] this is an array with the hook, the decoupled getState function and the decoupled setter of the state
 */
export const createGlobalStateWithDecoupledFuncs = <
  TState,
  TMetadata = null,
  TActions extends ActionCollectionConfig<TState, TMetadata> | null = null
>(
  state: TState,
  {
    actions,
    ...config
  }: {
    /**
     * @description
     * The type of the actionsConfig object (optional) (default: null) if a configuration is passed, the hook will return an object with the actions then all the store manipulation will be done through the actions
     */
    actions?: TActions;

    /**
     * @param {StateConfigCallbackParam<TState, TMetadata> => void} metadata - the initial value of the metadata
     * */
    metadata?: TMetadata;

    /**
     * @param {StateConfigCallbackParam<TState, TMetadata> => void} onInit - callback function called when the store is initialized
     * @returns {void} result - void
     * */
    onInit?: (
      parameters: StateConfigCallbackParam<TState, TMetadata, TActions>
    ) => void;

    /**
     * @param {StateChangesParam<TState, TMetadata> => void} onStateChanged - callback function called every time the state is changed
     * @returns {void} result - void
     */
    onStateChanged?: (
      parameters: StateChangesParam<TState, TMetadata, TActions>
    ) => void;

    /**
     * @param {StateConfigCallbackParam<TState, TMetadata> => void} onSubscribed - callback function called every time a component is subscribed to the store
     * @returns {void} result - void
     */
    onSubscribed?: (
      parameters: StateConfigCallbackParam<TState, TMetadata, TActions>
    ) => void;

    /**
     * @param {StateChangesParam<TState, TMetadata> => boolean} computePreventStateChange - callback function called every time the state is about to change and it allows you to prevent the state change
     * @returns {boolean} result - true if you want to prevent the state change, false otherwise
     */
    computePreventStateChange?: (
      parameters: StateChangesParam<TState, TMetadata, TActions>
    ) => boolean;
  } = {}
) => {
  const store = new GlobalStore<TState, TMetadata, TActions>(
    state,
    config,
    actions
  );

  const [getState, setter] = store.getHookDecoupled();

  type Setter = TActions extends StateSetter<TState> | null | never
    ? StateSetter<TState>
    : ActionCollectionResult<TState, TMetadata, TActions>;

  return [store.getHook(), getState, setter] as unknown as [
    useState: <State = TState>(
      selector?: (state: TState) => State,
      config?: UseHookConfig<State>
    ) => [State, Setter, TMetadata],
    getter: <Subscription extends Subscribe | false = false>(
      callback?: Subscription extends true
        ? ({
            state,
            subscribe,
            subscribeSelector,
          }: {
            state: TState;
            subscribe: (
              /**
               * This callback will be executed every time the state is changed
               */
              callback: (state: TState) => void,

              /**
               * The configuration object
               * In the configuration object you can specify a custom compare function to check if the state is changed
               */
              config?: {
                /**
                 * The callback to execute when the state is changed to check if the same really changed
                 * If the function is not provided the derived state will perform a shallow comparison
                 */
                isEqual?: (current: TState, next: TState) => boolean;

                /**
                 * By default the callback is executed immediately after the subscription
                 */
                skipFirst?: boolean;
              }
            ) => void;
            subscribeSelector: <TDerivate>(
              /**
               * The selector function to derive the state
               * @param {TState} state - the current state of the store
               * @returns {TDerivate} result - the derived state
               * */
              selector: (state: TState) => TDerivate,

              /**
               * This callback will be executed every time the state is changed
               */
              callback: (state: TDerivate) => void,

              /**
               * The configuration object
               * In the configuration object you can specify a custom compare function to check if the state is changed
               */
              config?: {
                /**
                 * The callback to execute when the state is changed to check if the same really changed
                 * If the function is not provided the derived state will perform a shallow comparison
                 */
                isEqual?: (current: TDerivate, next: TDerivate) => boolean;

                /**
                 * By default the callback is executed immediately after the subscription
                 */
                skipFirst?: boolean;
              }
            ) => void;
          }) => void
        : null
    ) => Subscription extends false ? TState : UnsubscribeCallback,
    setter: TActions extends null
      ? StateSetter<TState>
      : ActionCollectionResult<TState, TMetadata, TActions>
  ];
};

/**
 * Creates a global hook that can be used to access the state and actions across the application
 * @param {TState} state - The initial state of the store
 * @param {{ config?: GlobalStoreConfig<TState, TMetadata, TStateSetter>; actionsConfig?: TStateSetter | null }} parameters - The configuration object of the store and the configuration object of the state setter (optional) (default: null)
 * @param {GlobalStoreConfig<TState, TMetadata, TStateSetter>} parameters.config - The configuration object of the store
 * @param {TStateSetter | null} parameters.actionsConfig - The configuration object of the state setter (optional) (default: null)
 * @returns {} - () => [TState, Setter, TMetadata] the hook that can be used to access the state and the setter of the state
 */
export const createGlobalState = <
  TState,
  TMetadata = null,
  TActions extends ActionCollectionConfig<TState, TMetadata> | null = null
>(
  state: TState,
  config: {
    /**
     * @description
     * The type of the actionsConfig object (optional) (default: null) if a configuration is passed, the hook will return an object with the actions then all the store manipulation will be done through the actions
     */
    actions?: TActions;

    /**
     * @param {StateConfigCallbackParam<TState, TMetadata> => void} metadata - the initial value of the metadata
     * */
    metadata?: TMetadata;

    /**
     * @param {StateConfigCallbackParam<TState, TMetadata> => void} onInit - callback function called when the store is initialized
     * @returns {void} result - void
     * */
    onInit?: (
      parameters: StateConfigCallbackParam<TState, TMetadata, TActions>
    ) => void;

    /**
     * @param {StateChangesParam<TState, TMetadata> => void} onStateChanged - callback function called every time the state is changed
     * @returns {void} result - void
     */
    onStateChanged?: (
      parameters: StateChangesParam<TState, TMetadata, TActions>
    ) => void;

    /**
     * @param {StateConfigCallbackParam<TState, TMetadata> => void} onSubscribed - callback function called every time a component is subscribed to the store
     * @returns {void} result - void
     */
    onSubscribed?: (
      parameters: StateConfigCallbackParam<TState, TMetadata, TActions>
    ) => void;

    /**
     * @param {StateChangesParam<TState, TMetadata> => boolean} computePreventStateChange - callback function called every time the state is about to change and it allows you to prevent the state change
     * @returns {boolean} result - true if you want to prevent the state change, false otherwise
     */
    computePreventStateChange?: (
      parameters: StateChangesParam<TState, TMetadata, TActions>
    ) => boolean;
  } = {}
) => {
  const [useState] = createGlobalStateWithDecoupledFuncs(
    state,
    config as unknown
  );

  type Setter = TActions extends null
    ? StateSetter<TState>
    : ActionCollectionResult<TState, TMetadata, TActions>;

  return useState as <State = TState>(
    selector?: (state: TState) => State,
    config?: UseHookConfig<State>
  ) => [state: State, setter: Setter, metadata: TMetadata];
};

export type CustomGlobalHookParams<
  TInheritMetadata = null,
  TCustomConfig = {}
> = {
  /**
   * @description
   * This function is called when the state is initialized.
   */
  onInitialize: (
    {
      setState,
      setMetadata,
      getMetadata,
      getState,
      actions,
    }: StateConfigCallbackParam<any, TInheritMetadata>,
    config: TCustomConfig
  ) => void;

  /**
   * @description
   * This function is called when the state is changed.
   */
  onChange: (
    {
      setState,
      setMetadata,
      getMetadata,
      getState,
      actions,
    }: StateChangesParam<any, TInheritMetadata>,
    config: TCustomConfig
  ) => void;
};

/**
 * @description
 * Use this function to create a custom global store.
 * You can use this function to create a store with async storage.
 */
export const createCustomGlobalStateWithDecoupledFuncs = <
  TInheritMetadata = null,
  TCustomConfig = null
>({
  onInitialize,
  onChange,
}: CustomGlobalHookParams<TInheritMetadata, TCustomConfig>) => {
  /**
   * @description
   * Use this function to create a custom global store.
   * You can use this function to create a store with async storage or any other custom logic.
   * @param state The initial state of the store.
   * @param config The configuration of the store.
   * @returns [HOOK, DECOUPLED_GETTER, DECOUPLED_SETTER] - this is an array with the hook, the decoupled getState function and the decoupled setter of the state
   */
  return <
    TState,
    TMetadata = null,
    TActions extends ActionCollectionConfig<
      TState,
      AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>
    > | null = null
  >(
    state: TState,
    {
      config: customConfig,
      actions,
      metadata,
      onInit,
      onStateChanged,
      onSubscribed,
      computePreventStateChange,
    }: {
      config?: TCustomConfig;

      actions?: TActions;

      metadata?: TMetadata;

      onInit?: GlobalStoreConfig<
        TState,
        AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
        TActions
      >["onInit"];

      onStateChanged?: GlobalStoreConfig<
        TState,
        AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
        TActions
      >["onStateChanged"];

      onSubscribed?: GlobalStoreConfig<
        TState,
        AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
        TActions
      >["onSubscribed"];

      computePreventStateChange?: GlobalStoreConfig<
        TState,
        AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
        TActions
      >["computePreventStateChange"];
    } = {
      config: null,
    }
  ) => {
    const onInitWrapper = ((callBackParameters) => {
      onInitialize(
        callBackParameters as unknown as StateConfigCallbackParam<
          unknown,
          TInheritMetadata
        >,
        customConfig
      );

      onInit?.(callBackParameters);
    }) as typeof onInit;

    const onStateChangeWrapper = (
      callBackParameters: StateChangesParam<
        TState,
        AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
        TActions
      >
    ) => {
      onChange(
        callBackParameters as unknown as StateChangesParam<
          unknown,
          TInheritMetadata
        >,
        customConfig
      );

      onStateChanged?.(callBackParameters);
    };

    type Setter = TActions extends null | undefined | never
      ? StateSetter<TState>
      : ActionCollectionResult<
          TState,
          AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
          TActions
        >;

    return createGlobalStateWithDecoupledFuncs<
      TState,
      AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
      TActions
    >(state, {
      actions,
      metadata: metadata as AvoidNever<TInheritMetadata> &
        AvoidNever<TMetadata>,
      onInit: onInitWrapper,
      onStateChanged: onStateChangeWrapper,
      onSubscribed,
      computePreventStateChange,
    }) as unknown as [
      useState: <State = TState>(
        selector?: (state: TState) => State,
        config?: UseHookConfig<State>
      ) => [
        State,
        Setter,
        AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>
      ],
      getter: <Subscription extends Subscribe | false = false>(
        callback?: Subscription extends true
          ? ({
              state,
              subscribe,
              subscribeSelector,
            }: {
              state: TState;
              subscribe: (
                /**
                 * This callback will be executed every time the state is changed
                 */
                callback: (state: TState) => void,

                /**
                 * The configuration object
                 * In the configuration object you can specify a custom compare function to check if the state is changed
                 */
                config?: {
                  /**
                   * The callback to execute when the state is changed to check if the same really changed
                   * If the function is not provided the derived state will perform a shallow comparison
                   */
                  isEqual?: (current: TState, next: TState) => boolean;

                  /**
                   * By default the callback is executed immediately after the subscription
                   */
                  skipFirst?: boolean;
                }
              ) => void;
              subscribeSelector: <TDerivate>(
                /**
                 * The selector function to derive the state
                 * @param {TState} state - the current state of the store
                 * @returns {TDerivate} result - the derived state
                 * */
                selector: (state: TState) => TDerivate,

                /**
                 * This callback will be executed every time the state is changed
                 */
                callback: (state: TDerivate) => void,

                /**
                 * The configuration object
                 * In the configuration object you can specify a custom compare function to check if the state is changed
                 */
                config?: {
                  /**
                   * The callback to execute when the state is changed to check if the same really changed
                   * If the function is not provided the derived state will perform a shallow comparison
                   */
                  isEqual?: (current: TDerivate, next: TDerivate) => boolean;

                  /**
                   * By default the callback is executed immediately after the subscription
                   */
                  skipFirst?: boolean;
                }
              ) => void;
            }) => void
          : null
      ) => Subscription extends false ? TState : UnsubscribeCallback,
      setter: TActions extends null | undefined | never
        ? StateSetter<TState>
        : ActionCollectionResult<
            TState,
            AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
            TActions
          >
    ];
  };
};

/**
 * @description
 * Use this function to create a custom global store.
 * You can use this function to create a store with async storage.
 * This function will return a hook that you can use to access the store.
 * @param state The initial state of the store.
 * @param config The configuration of the store.
 * @returns {[TState, TStateSetter, TMetadata]} The state, the state setter and the metadata of the store.
 */
export const createCustomGlobalState = <
  TInheritMetadata = null,
  TCustomConfig = {}
>({
  onInitialize,
  onChange,
}: CustomGlobalHookParams<TInheritMetadata, TCustomConfig>) => {
  const customBuilder = createCustomGlobalStateWithDecoupledFuncs<
    TInheritMetadata,
    TCustomConfig
  >({
    onInitialize,
    onChange,
  });

  type InheritMetadata = TInheritMetadata extends null | undefined | never
    ? {}
    : TInheritMetadata;

  /**
   * @description
   * Use this function to create a custom global store.
   * You can use this function to create a store with async storage or any other custom logic.
   * @param state The initial state of the store.
   * @param config The configuration of the store.
   * @returns {} - () => [TState, Setter, TMetadata] the hook that can be used to access the state and the setter of the state
   */
  return <
    TState,
    TMetadata = null,
    TActions extends ActionCollectionConfig<
      TState,
      AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>
    > | null = null
  >(
    state: TState,
    {
      config: customConfig,
      actions,
      metadata,
      onInit,
      onStateChanged,
      onSubscribed,
      computePreventStateChange,
    }: {
      /**
       * Configuration of the custom global store
       */
      config?: TCustomConfig;

      /**
       * @description
       * (optional) (default: null) if a configuration is passed, the hook will return an object with the actions then all the store manipulation will be done through the actions
       */
      actions?: TActions | null;

      /**
       * @param {StateConfigCallbackParam<TState, TMetadata> => void} metadata - the initial value of the metadata
       * */
      metadata?: TMetadata;

      /**
       * @param {StateConfigCallbackParam<TState, TMetadata> => void} onInit - callback function called when the store is initialized
       * @returns {void} result - void
       * */
      onInit?: (
        parameters: StateConfigCallbackParam<
          TState,
          AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
          TActions
        >
      ) => void;

      /**
       * @param {StateChangesParam<TState, TMetadata> => void} onStateChanged - callback function called every time the state is changed
       * @returns {void} result - void
       */
      onStateChanged?: (
        parameters: StateChangesParam<
          TState,
          AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
          TActions
        >
      ) => void;

      /**
       * @param {StateConfigCallbackParam<TState, TMetadata> => void} onSubscribed - callback function called every time a component is subscribed to the store
       * @returns {void} result - void
       */
      onSubscribed?: (
        parameters: StateConfigCallbackParam<
          TState,
          AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
          TActions
        >
      ) => void;

      /**
       * @param {StateChangesParam<TState, TMetadata> => boolean} computePreventStateChange - callback function called every time the state is about to change and it allows you to prevent the state change
       * @returns {boolean} result - true if you want to prevent the state change, false otherwise
       */
      computePreventStateChange?: (
        parameters: StateChangesParam<
          TState,
          AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
          TActions
        >
      ) => boolean;
    } = {
      config: {} as TCustomConfig,
    }
  ) => {
    const [useHook] = customBuilder(state, {
      config: customConfig,
      actions,
      metadata,
      onInit,
      onStateChanged,
      onSubscribed,
      computePreventStateChange,
    });

    type Metadata = TMetadata extends null | undefined | never ? {} : TMetadata;

    type Setter = TActions extends null
      ? StateSetter<TState>
      : ActionCollectionResult<
          TState,
          AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
          TActions
        >;

    return useHook as unknown as <State = TState>(
      selector?: (state: TState) => State,
      config?: UseHookConfig<State>
    ) => [state: State, setter: Setter, metadata: InheritMetadata & Metadata];
  };
};

/**
 * @description
 * Use this function to create a custom global hook which contains a fragment of the state of another hook or a fragment
 */
export const createDerivate =
  <TState, TSetter, TMetadata, TDerivate>(
    useHook: StateHook<TState, TSetter, TMetadata>,
    selector_: (state: TState) => TDerivate,
    config_: UseHookConfig<TDerivate> = {}
  ) =>
  <State = TDerivate>(
    selector?: (state: TDerivate) => State,
    config: UseHookConfig<State> = null
  ) => {
    return useHook<State>((state) => {
      const fragment = selector_(state);

      return (selector ? selector(fragment) : fragment) as State;
    }, (selector && config ? config : config_) as UseHookConfig<State>);
  };

/**
 * @description
 * This function allows you to create a derivate emitter
 * With this approach, you can subscribe to changes in a specific fragment or subset of the state.
 */
export const createDerivateEmitter =
  <
    TDerivate,
    TGetter extends StateGetter<unknown>,
    TState = Exclude<ReturnType<TGetter>, UnsubscribeCallback>
  >(
    getter: TGetter,
    selector_: (state: TState) => TDerivate,
    config_: UseHookConfig<TDerivate> = {}
  ) =>
  <State = TDerivate>(
    callback: SubscribeCallback<State>,
    selector?: (state: TDerivate) => State,
    config: UseHookConfig<State> = null
  ) => {
    return (getter as unknown as StateGetter<TState, Subscribe>)(
      ({ subscribeSelector }) => {
        subscribeSelector<State>(
          (state) => {
            const fragment = selector_(state);

            return (selector ? selector(fragment) : fragment) as State;
          },
          callback,
          (selector && config ? config : config_) as UseHookConfig<State>
        );
      }
    );
  };
