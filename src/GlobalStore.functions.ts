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
  StateHook,
  StateGetter,
  SubscribeCallback,
  Subscribe,
  createStateConfig,
  CustomGlobalHookBuilderParams,
  CustomGlobalHookParams,
  SelectorCallback,
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
  { actions, ...config }: createStateConfig<TState, TMetadata, TActions> = {}
) => {
  const store = new GlobalStore<TState, TMetadata, TActions>(
    state,
    config,
    actions
  );

  const [getState, setter] = store.getHookDecoupled();

  type Setter = keyof TActions extends never
    ? StateSetter<TState>
    : ActionCollectionResult<TState, TMetadata, TActions>;

  return [store.getHook(), getState, setter] as [
    hook: StateHook<TState, Setter, TMetadata>,
    getter: StateGetter<TState>,
    setter: Setter
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
  config: createStateConfig<TState, TMetadata, TActions> = {}
) => {
  const [useState] = createGlobalStateWithDecoupledFuncs<
    TState,
    TMetadata,
    TActions
  >(state, config as unknown);

  return useState;
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
}: CustomGlobalHookBuilderParams<TInheritMetadata, TCustomConfig>) => {
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
      onInit,
      onStateChanged,
      ...parameters
    }: CustomGlobalHookParams<
      TCustomConfig,
      TState,
      AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
      TActions
    > = {
      config: null,
    }
  ) => {
    const onInitWrapper = ((callBackParameters) => {
      onInitialize(
        callBackParameters as StateConfigCallbackParam<
          unknown,
          TInheritMetadata
        >,
        customConfig
      );

      onInit?.(callBackParameters);
    }) as typeof onInit;

    const onStateChangeWrapper = ((callBackParameters) => {
      onChange(
        callBackParameters as StateChangesParam<unknown, TInheritMetadata>,
        customConfig
      );

      onStateChanged?.(callBackParameters);
    }) as typeof onStateChanged;

    return createGlobalStateWithDecoupledFuncs<
      TState,
      typeof parameters.metadata,
      TActions
    >(state, {
      onInit: onInitWrapper,
      onStateChanged: onStateChangeWrapper,
      ...parameters,
    });
  };
};

/**
 * @description
 * Use this function to create a custom global hook which contains a fragment of the state of another hook or a fragment
 */
export const createDerivate =
  <TState, TSetter, TMetadata, TDerivate>(
    useHook: StateHook<TState, TSetter, TMetadata>,
    selector_: SelectorCallback<TState, TDerivate>,
    config_: UseHookConfig<TDerivate> = {}
  ) =>
  <State = TDerivate>(
    selector?: SelectorCallback<TDerivate, State>,
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
    selector_: SelectorCallback<TState, TDerivate>,
    config_: UseHookConfig<TDerivate> = {}
  ) =>
  <State = TDerivate>(
    callback: SubscribeCallback<State>,
    selector?: SelectorCallback<TDerivate, State>,
    config: UseHookConfig<State> = null
  ) => {
    return getter<Subscribe>(({ subscribeSelector }) => {
      subscribeSelector<State>(
        (state) => {
          const fragment = selector_(state as TState);

          return (selector ? selector(fragment) : fragment) as State;
        },
        callback,
        (selector && config ? config : config_) as UseHookConfig<State>
      );
    });
  };
