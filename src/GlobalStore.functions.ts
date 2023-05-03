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
  CombinedAsyncHook,
} from "GlobalStore.types";
import { debounce, shallowCompare } from "GlobalStore.utils";
import { useCallback, useEffect, useState } from "react";
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
  const getters = args as unknown as StateGetter<unknown>[];

  const useHook = <State = TDerivate>(
    selector?: SelectorCallback<TResults, State>,
    config?: UseHookConfig<State> & {
      delay?: number;
    }
  ): [State] => {
    const $config = {
      delay: 0,
      isEqual: shallowCompare,
      ...(parameters.config ?? {}),
      ...(config ?? {}),
    };

    const selectorWrapper = useCallback((results: TResults): State => {
      const parentFragment = parameters.selector(results);

      const newState = (
        selector
          ? selector(parentFragment as unknown as TResults)
          : parentFragment
      ) as State;

      return newState;
    }, []);

    const [state, setState] = useState<State>(() => {
      const values = getters.map((useHook) => useHook()) as TResults;

      // gets the initial value of the derivate state
      return selectorWrapper(values);
    });

    useEffect(() => {
      const results = new Map<number, unknown>();
      const subscribers: UnsubscribeCallback[] = [];

      const compareCallback = ($config.isEqual ?? shallowCompare) as (
        a: State,
        b: State
      ) => boolean;

      let currentState = state;

      const updateState = debounce(() => {
        const newState = selectorWrapper(
          // the update is always async and base on the group of values
          Array.from(results.values()) as TResults
        );

        // if the new state is equal to the current state, then we don't need to update the state
        if (compareCallback?.(currentState, newState)) return;

        setState(newState);
      }, $config.delay ?? 0);

      getters.forEach((useHook, index) => {
        const subscription = useHook<Subscribe>((value) => {
          results.set(index, value);

          updateState();
        });

        subscribers.push(subscription);
      });

      return () => {
        subscribers.forEach((unsubscribe) => unsubscribe());
      };
    }, []);

    return [state];
  };

  return useHook;
};

const [_1, getter1] = createGlobalStateWithDecoupledFuncs({
  a: 1,
});

const [_2, getter2] = createGlobalStateWithDecoupledFuncs({
  b: 2,
});

const useCombined = combineAsyncGetters(
  {
    selector: ([a, b]) => {
      return {
        ...a,
        ...b,
      };
    },
  },
  getter1,
  getter2
);
