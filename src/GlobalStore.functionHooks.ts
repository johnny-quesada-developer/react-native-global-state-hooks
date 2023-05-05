import {
  ActionCollectionConfig,
  StateConfigCallbackParam,
  StateChangesParam,
  StateSetter,
  ActionCollectionResult,
  UseHookConfig,
  AvoidNever,
  UnsubscribeCallback,
  StateHook,
  StateGetter,
  SubscribeCallback,
  Subscribe,
  createStateConfig,
  CustomGlobalHookBuilderParams,
  CustomGlobalHookParams,
  SelectorCallback,
  SubscribeCallbackConfig,
  SubscribeToEmitter,
} from "./GlobalStore.types";

import { GlobalStore } from "./GlobalStore";

/**
 * Creates a global state with the given state and config.
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
    StateHook<TState, Setter, TMetadata>,
    StateGetter<TState>,
    Setter
  ];
};

/**
 * Creates a global hook that can be used to access the state and actions across the application
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
  >(state, config);

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
export const createDerivateEmitter = <
  TDerivate,
  TGetter extends StateGetter<unknown>,
  TState = Exclude<ReturnType<TGetter>, UnsubscribeCallback>
>(
  getter: TGetter,
  selector: SelectorCallback<TState, TDerivate>
): SubscribeToEmitter<TDerivate> => {
  type Infected = {
    _father_emitter?: {
      getter: StateGetter<unknown>;
      selector: SelectorCallback<TState, TDerivate>;
    };
  };

  const father_emitter = (getter as Infected)._father_emitter;

  if (father_emitter) {
    // if a subscriber is already a derivate emitter, then we need to merge the selectors
    const selectorWrapper = (state: TState): TDerivate => {
      const fatherFragment = father_emitter.selector(state);

      return selector(fatherFragment as unknown as TState);
    };

    const subscriber = createDerivateEmitter<TDerivate, TGetter, TState>(
      father_emitter.getter as TGetter,
      selectorWrapper
    );

    (subscriber as Infected)._father_emitter = {
      getter: father_emitter.getter,
      selector: selectorWrapper,
    };

    return subscriber;
  }

  const subscriber = <State = TDerivate>(
    param1: SubscribeCallback<State> | SelectorCallback<TDerivate, State>,
    param2?: SubscribeCallback<State> | SubscribeCallbackConfig<State>,
    param3: SubscribeCallbackConfig<State> = {}
  ) => {
    const hasExplicitSelector = typeof param2 === "function";

    const $selector = (hasExplicitSelector ? param1 : null) as SelectorCallback<
      unknown,
      unknown
    >;

    const callback = (
      hasExplicitSelector ? param2 : param1
    ) as SubscribeCallback<unknown>;

    const config = (
      hasExplicitSelector ? param3 : param2
    ) as SubscribeCallbackConfig<unknown>;

    return (getter as StateGetter<unknown>)<Subscribe>((subscribe) => {
      subscribe(
        (state) => {
          const fatherFragment = selector(state as TState);

          return $selector?.(fatherFragment) ?? fatherFragment;
        },
        callback,
        config
      );
    });
  };

  (subscriber as Infected)._father_emitter = {
    getter,
    selector,
  };

  return subscriber as SubscribeToEmitter<TDerivate>;
};
