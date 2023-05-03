import { createDecoupledPromise } from "cancelable-promise-jq";

import {
  StoreTools,
  Subscribe,
  SubscriberCallback,
} from "../src/GlobalStore.types";

import { useState } from "react";
import { formatFromStore, formatToStore } from "json-storage-formatter";
import { getFakeAsyncStorage } from "./getFakeAsyncStorage";

import {
  createCustomGlobalStateWithDecoupledFuncs,
  createGlobalStateWithDecoupledFuncs,
  createGlobalState,
} from "../src/GlobalStore.functions";

describe("basic", () => {
  it("should be able to create a new instance with state", () => {
    const stateValue = "test";
    const useValue = createGlobalState(stateValue, {
      metadata: {
        test: true,
      },
      onInit: () => {},
    });

    let [state, setState, metadata] = useValue();

    expect(useValue).toBeInstanceOf(Function);
    expect(state).toBe(stateValue);
    expect(setState).toBeInstanceOf(Function);
    expect(metadata.test).toBe(true);

    setState("test2");

    [state, setState, metadata] = useValue();

    expect(state).toBe("test2");
    expect(useState).toHaveBeenCalledTimes(2);

    setState((current) => current + 1);

    [state, setState, metadata] = useValue();

    expect(state).toBe("test21");
    expect(useState).toHaveBeenCalledTimes(3);
  });
});

describe("with actions", () => {
  it("should be able to create a new instance with state and actions, setter should be and object", () => {
    type Metadata = {
      modificationsCounter: number;
    };

    const useCount = createGlobalState(1, {
      metadata: {
        modificationsCounter: 0,
      },
      actions: {
        logModification() {
          return ({ setMetadata }: StoreTools<number, Metadata>) => {
            setMetadata(({ modificationsCounter, ...metadata }) => ({
              ...metadata,
              modificationsCounter: modificationsCounter + 1,
            }));
          };
        },

        increase(increase: number = 1) {
          return ({
            setState,
            getState,
            actions,
          }: StoreTools<
            number,
            Metadata,
            {
              logModification: () => void;
            }
          >) => {
            setState((state) => state + increase);

            actions.logModification();

            return getState();
          };
        },

        decrease(decrease: number = 1) {
          return ({
            setState,
            getState,
            actions,
          }: StoreTools<
            number,
            Metadata,
            {
              logModification: () => void;
            }
          >) => {
            setState((state) => state - decrease);

            actions.logModification();

            return getState();
          };
        },
      } as const,
    });

    let [state, actions, metadata] = useCount();

    expect(useCount).toBeInstanceOf(Function);
    expect(metadata.modificationsCounter).toBe(0);

    expect(actions).toBeInstanceOf(Object);
    expect(actions.decrease).toBeInstanceOf(Function);
    expect(actions.increase).toBeInstanceOf(Function);

    expect(state).toBe(1);
    expect(metadata).toEqual({
      modificationsCounter: 0,
    });

    actions.increase();
    actions.increase(2);

    [state, actions, metadata] = useCount();

    expect(state).toBe(4);
    expect(metadata).toEqual({
      modificationsCounter: 2,
    });

    actions.decrease();
    actions.decrease(2);

    [state, actions, metadata] = useCount();

    expect(state).toBe(1);
    expect(metadata).toEqual({
      modificationsCounter: 4,
    });
  });
});

describe("with configuration callbacks", () => {
  it("should execute onInit callback", () => {
    const onInitSpy = jest.fn(({ setMetadata }) => {
      setMetadata({
        test: true,
      });
    });

    const useCount = createGlobalState(1, {
      onInit: onInitSpy,
    });

    expect(onInitSpy).toBeCalledTimes(1);

    const [state, setState, metadata] = useCount();

    expect(state).toBe(1);
    expect(setState).toBeInstanceOf(Function);
    expect(metadata).toEqual({
      test: true,
    });
  });

  it("should execute onSubscribed callback every time a subscriber is added", () => {
    const onSubscribedSpy = jest.fn();

    const useCount = createGlobalState(
      {
        test: new Date(),
      },
      {
        onSubscribed: onSubscribedSpy,
      }
    );

    expect(onSubscribedSpy).toBeCalledTimes(0);

    const [state, setState] = useCount();

    expect(onSubscribedSpy).toBeCalledTimes(1);

    const [state2] = useCount();

    expect(onSubscribedSpy).toBeCalledTimes(2);

    expect(state).toBe(state2);
  });

  it("should execute onStateChanged callback every time the state is changed", () => {
    const onStateChangedSpy = jest.fn();

    const useCount = createGlobalState(
      { a: true },
      {
        onStateChanged: onStateChangedSpy,
      }
    );

    expect(onStateChangedSpy).toBeCalledTimes(0);

    const [, setState] = useCount();

    setState({ a: true });

    expect(onStateChangedSpy).toBeCalledTimes(1);

    setState({ a: false });

    expect(onStateChangedSpy).toBeCalledTimes(2);
  });

  it("should execute computePreventStateChange callback before state is changed and continue if it returns false", () => {
    const computePreventStateChangeSpy = jest.fn();

    const useCount = createGlobalState(0, {
      computePreventStateChange: computePreventStateChangeSpy,
    });

    expect(computePreventStateChangeSpy).toBeCalledTimes(0);

    const [state, setState, metadata] = useCount();

    expect(state).toEqual(0);
    expect(setState).toBeInstanceOf(Function);
    expect(metadata).toBe(null);

    setState((state) => state + 1);

    expect(computePreventStateChangeSpy).toBeCalledTimes(1);
  });

  it("should execute computePreventStateChange callback before state is changed and prevent state change if it returns true", () => {
    const computePreventStateChangeSpy = jest.fn();

    const useCount = createGlobalState(0, {
      computePreventStateChange: (parameters) => {
        computePreventStateChangeSpy();

        const { setState, getMetadata, setMetadata, actions } = parameters;

        expect(getMetadata()).toBeNull();
        expect(setState).toBeInstanceOf(Function);
        expect(setMetadata).toBeInstanceOf(Function);
        expect(actions).toBe(null);

        return true;
      },
    });

    expect(computePreventStateChangeSpy).toBeCalledTimes(0);

    const [state, setState, metadata] = useCount();

    expect(state).toEqual(0);
    expect(setState).toBeInstanceOf(Function);
    expect(metadata).toBe(null);

    setState((state) => state + 1);

    expect(computePreventStateChangeSpy).toBeCalledTimes(1);
    expect(state).toEqual(0);
  });
});

describe("custom global hooks", () => {
  const getInitialState = () => {
    return new Map([
      [1, { name: "john" }],
      [2, { name: "doe" }],
    ]);
  };

  it("should initialize the store with the initial state where there is no async storage data", () => {
    const { fakeAsyncStorage } = getFakeAsyncStorage();

    const { promise: mainPromise, ...tools } = createDecoupledPromise();

    const onStateChangedSpy = jest.fn(({ getState }) => {
      const newState = getState();

      fakeAsyncStorage.setItem(
        "items",
        formatToStore(newState, {
          stringify: true,
        })
      );
    });

    const onInitSpy = jest.fn(async ({ setMetadata, setState }) => {
      const stored = (await fakeAsyncStorage.getItem("items")) ?? null;

      setMetadata({
        isAsyncStorageReady: true,
      });

      if (stored) return;

      setState((state) => state, {
        forceUpdate: true,
      });

      tools.resolve();

      return;
    });

    const initialState = new Map<number, string>();

    const useCount = createGlobalState(initialState, {
      onStateChanged: onStateChangedSpy,
      onInit: onInitSpy,
    });

    let [state, setState, metadata] = useCount();

    expect.assertions(5);

    expect(state).toEqual(initialState);
    expect(setState).toBeInstanceOf(Function);
    expect(metadata).toEqual(null);

    return mainPromise.then(() => {
      [state, setState, metadata] = useCount();

      expect(state).toEqual(initialState);
      expect(metadata).toEqual({
        isAsyncStorageReady: true,
      });
    });
  });

  it("should initialize the store with the async storage data where there is async storage data", () => {
    const initialState = getInitialState();
    const { fakeAsyncStorage } = getFakeAsyncStorage();

    fakeAsyncStorage.setItem("items", formatToStore(initialState));

    const { promise: mainPromise, ...tools } = createDecoupledPromise();

    const onStateChangedSpy = jest.fn(({ getState }) => {
      const newState = getState();

      fakeAsyncStorage.setItem(
        "items",
        formatToStore(newState, {
          stringify: true,
        })
      );
    });

    const onInitSpy = jest.fn(async ({ setMetadata, setState }) => {
      const stored = (await fakeAsyncStorage.getItem("items")) ?? null;

      setMetadata({
        isAsyncStorageReady: true,
      });

      if (!stored) return;

      setState(
        formatFromStore(stored, {
          jsonParse: true,
        }),
        {
          forceUpdate: true,
        }
      );

      tools.resolve();
    });

    const useCount = createGlobalState(initialState, {
      onStateChanged: onStateChangedSpy,
      onInit: onInitSpy,
    });

    let [state, setState, metadata] = useCount();

    expect(state).toEqual(initialState);
    expect(setState).toBeInstanceOf(Function);
    expect(metadata).toEqual(null);

    return mainPromise.then(() => {
      [state, setState, metadata] = useCount();

      expect(state).toEqual(
        new Map([
          [1, { name: "john" }],
          [2, { name: "doe" }],
        ])
      );

      expect(metadata).toEqual({
        isAsyncStorageReady: true,
      });

      expect(onStateChangedSpy).toBeCalledTimes(1);
      expect(onInitSpy).toBeCalledTimes(1);

      expect(fakeAsyncStorage.getItem).toBeCalledTimes(1);
      expect(fakeAsyncStorage.setItem).toBeCalledTimes(2);

      expect(fakeAsyncStorage.getItem).toBeCalledWith("items");
    });
  });

  it("should be able to update the store async storage", () => {
    const initialState = getInitialState();
    const { fakeAsyncStorage } = getFakeAsyncStorage();

    const { promise: mainPromise, ...tools } = createDecoupledPromise();

    const onStateChangedSpy = jest.fn(({ getState }) => {
      const newState = getState();

      fakeAsyncStorage.setItem(
        "items",
        formatToStore(newState, {
          stringify: true,
        })
      );

      tools.resolve();
    });

    const onInitSpy = jest.fn(async ({ setMetadata, setState }) => {
      const stored = (await fakeAsyncStorage.getItem("items")) ?? null;

      setMetadata({
        isAsyncStorageReady: true,
      });

      if (stored) return;

      setState((state) => state, {
        forceUpdate: true,
      });
    });

    const useCount = createGlobalState(initialState, {
      onStateChanged: onStateChangedSpy,
      onInit: onInitSpy,
    });

    let [state, setState, metadata] = useCount();

    expect(state).toEqual(initialState);
    expect(setState).toBeInstanceOf(Function);
    expect(metadata).toEqual(null);

    return mainPromise.then(() => {
      [state, setState, metadata] = useCount();

      expect(state).toBe(initialState);

      expect(metadata).toEqual({
        isAsyncStorageReady: true,
      });

      expect(onStateChangedSpy).toBeCalledTimes(1);
      expect(onInitSpy).toBeCalledTimes(1);

      expect(fakeAsyncStorage.getItem).toBeCalledTimes(1);
      expect(fakeAsyncStorage.setItem).toBeCalledTimes(1);

      expect(fakeAsyncStorage.getItem).toBeCalledWith("items");
    });
  });

  it("should be able to access custom actions from other actions", () => {
    expect.assertions(9);

    const logSpy = jest.fn();

    const [useCount, getCount, $actions] = createGlobalStateWithDecoupledFuncs(
      1,
      {
        metadata: {
          test: true,
        },
        actions: {
          log: (message: string) => {
            return () => {
              logSpy(message);
            };
          },
          increase: () => {
            return ({ setState }) => {
              setState((state) => state + 1);

              $actions.log("increase");
            };
          },
          decrease: () => {
            return ({ setState }) => {
              setState((state) => state - 1);

              $actions.log("decrease");
            };
          },
        },
      }
    );

    let [state, actions] = useCount();

    expect(state).toEqual(1);
    expect(logSpy).toBeCalledTimes(0);

    actions.increase();

    expect(getCount()).toEqual(2);
    expect(logSpy).toBeCalledTimes(1);
    expect(logSpy).toBeCalledWith("increase");

    actions.decrease();

    expect(getCount()).toEqual(1);
    expect(logSpy).toBeCalledTimes(2);
    expect(logSpy).toBeCalledWith("decrease");

    $actions.increase();

    const count = getCount();

    expect(count).toEqual(2);
  });

  it("should be able to create a custom global hook builder", () => {
    let config;

    const onInitSpy = jest.fn((_, _config) => {
      config = _config;
    });

    const onChangeSpy = jest.fn();

    const createGlobal = createCustomGlobalStateWithDecoupledFuncs({
      onInitialize: onInitSpy,
      onChange: onChangeSpy,
    });

    expect(createGlobal).toBeInstanceOf(Function);
    expect(onInitSpy).toBeCalledTimes(0);
    expect(onChangeSpy).toBeCalledTimes(0);

    const initialState = {
      count: 1,
    };

    const [useCount, getCount, setCount] = createGlobal(initialState, {
      config: {
        someExtraInfo: "someExtraInfo",
      },
    });

    expect(onInitSpy).toBeCalledTimes(1);
    expect(onChangeSpy).toBeCalledTimes(0);
    expect(config).toEqual({
      someExtraInfo: "someExtraInfo",
    });

    let [state, setState, metadata] = useCount();

    expect(state).toEqual(initialState);
    expect(setState).toBeInstanceOf(Function);
    expect(metadata).toEqual(null);

    expect(onInitSpy).toBeCalledTimes(1);
    expect(onChangeSpy).toBeCalledTimes(0);

    expect(getCount()).toEqual(initialState);

    setCount({
      count: 2,
    });

    expect(getCount()).toEqual({
      count: 2,
    });

    expect(onInitSpy).toBeCalledTimes(1);
    expect(onChangeSpy).toBeCalledTimes(1);

    [state, setState, metadata] = useCount();

    expect(state).toEqual({
      count: 2,
    });
    expect(setState).toBeInstanceOf(Function);
    expect(metadata).toEqual(null);

    expect(onInitSpy).toBeCalledTimes(1);
    expect(onChangeSpy).toBeCalledTimes(1);
  });

  it("should derivate new state from global", () => {
    const useCount = createGlobalState({
      a: 1,
      b: 2,
    });

    const selector = jest.fn(
      (state: { a: number; b: number }) => state.a + state.b
    );

    let [derivate, setState] = useCount(selector);

    expect(derivate).toEqual(3);
    expect(selector).toBeCalledTimes(1);

    setState((state) => ({
      ...state,
      a: 2,
    }));

    [derivate, setState] = useCount(selector);

    expect(derivate).toEqual(4);
  });

  it("should avoid derivate to re-render due to shallow equal", () => {
    const useData = createGlobalState({
      a: 1,
      b: 2,
      c: [1, 2, { a: 1 }],
    });

    const selector = jest.fn(({ a, c }: { a: number; c: any[] }) => ({
      a,
      c,
    }));

    let [derivate, setState] = useData(selector);

    expect(useState).toHaveBeenCalledTimes(1);
    expect(derivate).toEqual({
      a: 1,
      c: [1, 2, { a: 1 }],
    });

    setState((state) => ({
      ...state,
      b: 3,
    }));

    [derivate, setState] = useData(selector);

    // there should be just two calls to useState since the derivate didn't change
    expect(useState).toHaveBeenCalledTimes(2);
    expect(derivate).toEqual({
      a: 1,
      c: [1, 2, { a: 1 }],
    });

    let [data] = useData();

    expect(data).toEqual({
      a: 1,
      b: 3,
      c: [1, 2, { a: 1 }],
    });

    setState((state) => ({
      ...state,
      b: 4,
    }));

    [data] = useData();

    expect(data).toEqual({
      a: 1,
      b: 4,
      c: [1, 2, { a: 1 }],
    });

    expect(useState).toHaveBeenCalledTimes(4);
  });
});

describe("getter subscriptions", () => {
  it("should subscribe to changes from getter", () => {
    const [_, getter, setter] = createGlobalStateWithDecoupledFuncs({
      a: 3,
      b: 2,
    });

    const state = getter();

    // without a callback, it should return the current state
    expect(state).toEqual({
      a: 3,
      b: 2,
    });

    const subscriptionSpy = jest.fn();
    const subscriptionDerivateSpy = jest.fn();

    const callback = jest.fn((({ subscribe, subscribeSelector }) => {
      subscribe((state) => {
        subscriptionSpy(state);
      });

      subscribeSelector(
        (state) => {
          return state.a;
        },
        (derivate) => {
          subscriptionDerivateSpy(derivate);
        }
      );
    }) as SubscriberCallback<typeof state>);

    const removeSubscription = getter<Subscribe>(callback);

    expect(subscriptionSpy).toBeCalledTimes(1);
    expect(subscriptionSpy).toBeCalledWith(state);

    expect(subscriptionDerivateSpy).toBeCalledTimes(1);
    expect(subscriptionDerivateSpy).toBeCalledWith(3);

    setter((state) => ({
      ...state,
      b: 3,
    }));

    expect(subscriptionSpy).toBeCalledTimes(2);
    expect(subscriptionSpy).toBeCalledWith({
      a: 3,
      b: 3,
    });

    // the derivate should not be called since it didn't change
    expect(subscriptionDerivateSpy).toBeCalledTimes(1);

    removeSubscription();

    setter((state) => ({
      ...state,
      a: 4,
    }));

    // the subscription should not be called since it was removed
    expect(subscriptionSpy).toBeCalledTimes(2);
    expect(subscriptionDerivateSpy).toBeCalledTimes(1);
  });
});
