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
} from "GlobalStore.types";
import { debounce, shallowCompare } from "./GlobalStore.utils";
import { useEffect, useState } from "react";
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
      TDerivate,
      State
    >;

    const callback = (
      hasExplicitSelector ? param2 : param1
    ) as SubscribeCallback<State>;

    const config = (
      hasExplicitSelector ? param3 : param2
    ) as SubscribeCallbackConfig<State>;

    return (getter as StateGetter<TState>)<Subscribe>(
      ({ subscribeSelector }) => {
        subscribeSelector<State>(
          (state) => {
            const fatherFragment = selector(state);

            return (
              $selector?.(fatherFragment) ??
              (fatherFragment as unknown as State)
            );
          },
          callback,
          config
        );
      }
    );
  };

  (subscriber as Infected)._father_emitter = {
    getter,
    selector,
  };

  return subscriber as SubscribeToEmitter<TDerivate>;
};

/**
 * @description
 * This function allows you to create a derivate state by merging the state of multiple hooks.
 * The update of the derivate state is debounced to avoid unnecessary re-renders.
 * By default, the debounce delay is 0, but you can change it by passing a delay in milliseconds as the third parameter.
 */
export const combineAsyncGettersEmitter = <
  TDerivate,
  TArguments extends StateGetter<unknown>[],
  TResults = {
    [K in keyof TArguments]: TArguments[K] extends () => infer TResult
      ? Exclude<TResult, UnsubscribeCallback>
      : never;
  }
>(
  parameters: {
    selector: SelectorCallback<TResults, TDerivate>;
    config?: UseHookConfig<TDerivate> & {
      delay?: number;
    };
  },
  ...args: TArguments
) => {
  const getters = args as unknown as StateGetter<unknown>[];

  const dictionary = new Map<number, unknown>(
    getters.map((useHook, index) => [index, useHook()])
  );

  let parentState = parameters.selector(
    Array.from(dictionary.values()) as TResults
  );

  const parentIsEqual =
    parameters?.config?.isEqual !== undefined
      ? parameters?.config?.isEqual
      : shallowCompare;

  const subscribers = new Set<() => void>();

  const updateMainState = debounce(() => {
    const newState = parameters.selector(
      Array.from(dictionary.values()) as TResults
    );

    if (parentIsEqual?.(parentState, newState)) return;

    // update the parent state so the subscribers can be notified
    parentState = newState;

    subscribers.forEach((childCallback) => childCallback());
  }, parameters?.config?.delay);

  const getterSubscriptions = getters.map((useHook, index) =>
    useHook<Subscribe>((value) => {
      dictionary.set(index, value);

      updateMainState();
    })
  );

  const subscribe = <State = TDerivate>(
    /**
     * @description
     * The callback function to subscribe to the store changes or a selector function to derive the state
     */
    param1: SubscribeCallback<State> | SelectorCallback<TDerivate, State>,

    /**
     * @description
     * The configuration object or the callback function to subscribe to the store changes
     */
    param2?: SubscribeCallback<State> | SubscribeCallbackConfig<State>,

    /**
     * @description
     * The configuration object
     */
    param3?: SubscribeCallbackConfig<State>
  ) => {
    const hasExplicitSelector = typeof param2 === "function";

    const selector = (hasExplicitSelector ? param1 : null) as SelectorCallback<
      TDerivate,
      State
    >;

    const callback = (
      hasExplicitSelector ? param2 : param1
    ) as SubscribeCallback<State>;

    const config = (
      hasExplicitSelector ? param3 : param2
    ) as SubscribeCallbackConfig<State>;

    const $config = {
      delay: 0,
      isEqual: shallowCompare,
      ...(config ?? {}),
    };

    let childState = (selector?.(parentState) ?? parentState) as State;

    const updateState = debounce(() => {
      const newChildState = (selector?.(parentState) ?? parentState) as State;

      // if the new state is equal to the current state, then we don't need to update the state
      if ($config.isEqual?.(childState, newChildState)) return;

      childState = newChildState;

      callback(newChildState);
    }, $config.delay ?? 0);

    subscribers.add(updateState);

    return () => {
      subscribers.delete(updateState);
    };
  };

  return {
    subscribe: subscribe as SubscribeToEmitter<TDerivate>,
    getState: () => parentState,
    dispose: (() => {
      getterSubscriptions.forEach((unsubscribe) => unsubscribe());
    }) as UnsubscribeCallback,
  };
};

/**
 * @description
 * This function allows you to create a derivate state by merging the state of multiple hooks.
 * The update of the derivate state is debounced to avoid unnecessary re-renders.
 * By default, the debounce delay is 0, but you can change it by passing a delay in milliseconds as the third parameter.
 */
export const combineAsyncGetters = <
  TDerivate,
  TArguments extends StateGetter<unknown>[],
  TResults = {
    [K in keyof TArguments]: TArguments[K] extends () => infer TResult
      ? Exclude<TResult, UnsubscribeCallback>
      : never;
  }
>(
  parameters: {
    selector: SelectorCallback<TResults, TDerivate>;
    config?: UseHookConfig<TDerivate> & {
      delay?: number;
    };
  },
  ...args: TArguments
) => {
  const { subscribe, getState } = combineAsyncGettersEmitter<
    TDerivate,
    TArguments,
    TResults
  >(parameters, ...args);

  const useHook = <State = TDerivate>(
    selector?: SelectorCallback<TDerivate, State>,
    config?: UseHookConfig<State> & {
      delay?: number;
    }
  ) => {
    const [state, setState] = useState<State>(() => {
      const parentState = getState();

      return selector
        ? selector(parentState)
        : (parentState as unknown as State);
    });

    useEffect(() => {
      const $config = {
        delay: 0,
        isEqual: shallowCompare,
        ...(config ?? {}),
      };

      const compareCallback =
        $config.isEqual !== undefined ? $config.isEqual : shallowCompare;

      const unsubscribe = subscribe(
        (state) => {
          return selector ? selector(state) : (state as unknown as State);
        },
        debounce((state) => {
          const newState = selector
            ? selector(state)
            : (state as unknown as State);

          if (compareCallback?.(state, newState)) return;

          setState(newState);
        }, $config.delay ?? 0)
      );

      return () => {
        unsubscribe();
      };
    }, []);

    return [state, getState] as [
      state: typeof state,
      getParent: typeof getState
    ];
  };

  return useHook;
};
