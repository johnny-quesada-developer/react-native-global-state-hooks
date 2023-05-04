import {
  StateGetter,
  UnsubscribeCallback,
  SelectorCallback,
  UseHookConfig,
  Subscribe,
  SubscribeCallback,
  SubscribeCallbackConfig,
  SubscribeToEmitter,
  SubscriberCallback,
  StateHook,
} from "./GlobalStore.types";
import { shallowCompare } from "./GlobalStore.utils";
import { debounce } from "lodash";
import { useState, useEffect } from "react";
import { throwNoSubscribersWereAdded } from "./GlobalStore";

/**
 * @description
 * This function allows you to create a derivate state by merging the state of multiple hooks.
 * The update of the derivate state is debounced to avoid unnecessary re-renders.
 * By default, the debounce delay is 0, but you can change it by passing a delay in milliseconds as the third parameter.
 * @returns a tuple with the following elements: [subscribe, getState, dispose]
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
    useHook<Subscribe>((subscribe) => {
      subscribe((value) => {
        dictionary.set(index, value);

        updateMainState();
      });
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

    if (!$config.skipFirst) {
      // execute immediately the callback with the current state
      callback(childState);
    }

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

  const stateGetter = (<TCallback extends SubscriberCallback<TDerivate> | null>(
    $callback?: TCallback
  ) => {
    // if there is no subscription callback return the state
    if (!$callback) return parentState;

    const internalSubscribers: UnsubscribeCallback[] = [];

    $callback(((...parameters) => {
      internalSubscribers.push(subscribe(...parameters));
    }) as SubscribeToEmitter<TDerivate>);

    if (!internalSubscribers.length) {
      throwNoSubscribersWereAdded();
    }

    return () => {
      internalSubscribers.forEach((unsubscribe) => {
        unsubscribe();

        subscribers.delete(unsubscribe);
      });
    };
  }) as StateGetter<TDerivate>;

  return [
    subscribe as SubscribeToEmitter<TDerivate>,
    stateGetter,
    (() => {
      getterSubscriptions.forEach((unsubscribe) => unsubscribe());
    }) as UnsubscribeCallback,
  ] as [
    subscribe: SubscribeToEmitter<TDerivate>,
    getState: typeof stateGetter,
    dispose: UnsubscribeCallback
  ];
};

/**
 * @description
 * This function allows you to create a derivate state by merging the state of multiple hooks.
 * The update of the derivate state is debounced to avoid unnecessary re-renders.
 * By default, the debounce delay is 0, but you can change it by passing a delay in milliseconds as the third parameter.
 * @returns A tuple containing the subscribe function, the state getter and the dispose function
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
  const [subscribe, getState, dispose] = combineAsyncGettersEmitter<
    TDerivate,
    TArguments,
    TResults
  >(parameters, ...args);

  const useHook = (<State = TDerivate>(
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

    return [state, null, null];
  }) as StateHook<TDerivate, null, null>;

  return [useHook, getState, dispose] as [
    useHook: typeof useHook,
    getState: StateGetter<TDerivate>,
    dispose: UnsubscribeCallback
  ];
};
