import { createDecoupledPromise } from "easy-cancelable-promise/createDecoupledPromise";

import { formatFromStore, formatToStore } from "json-storage-formatter";
import { getFakeAsyncStorage } from "./getFakeAsyncStorage";
import { createGlobalState, createCustomGlobalState } from "..";
import { renderHook, act } from "@testing-library/react";

describe("basic", () => {
  it("should be able to create a new instance with state", () => {
    const stateValue = "test";
    const useValue = createGlobalState(stateValue, {
      metadata: {
        test: true,
      },
      callbacks: {
        onInit: () => {},
      },
    });

    const { result, rerender } = renderHook(() => useValue());
    let [state, setState, metadata] = result.current;

    expect(useValue).toBeInstanceOf(Function);
    expect(state).toBe(stateValue);
    expect(setState).toBeInstanceOf(Function);
    expect(metadata.test).toBe(true);

    act(() => {
      setState("test2");
    });

    rerender();
    [state, setState, metadata] = result.current;

    expect(state).toBe("test2");

    act(() => {
      setState((current) => current + 1);
    });

    rerender();
    [state, setState, metadata] = result.current;

    expect(state).toBe("test21");
  });
});

describe("with actions", () => {
  it("should be able to create a new instance with state and actions, setter should be and object", () => {
    const useCount = createGlobalState(1, {
      metadata: {
        modificationsCounter: 0,
      },
      actions: {
        logModification() {
          return ({ setMetadata }) => {
            setMetadata(({ modificationsCounter, ...metadata }) => ({
              ...metadata,
              modificationsCounter: modificationsCounter + 1,
            }));
          };
        },

        increase(increase: number = 1) {
          return ({ setState, getState }) => {
            const [, actions] = useCount.stateControls();
            setState((state) => state + increase);

            actions.logModification();

            return getState();
          };
        },

        decrease(decrease: number = 1) {
          return ({ setState, getState }) => {
            const [, actions] = useCount.stateControls();

            setState((state) => state - decrease);

            actions.logModification();

            return getState();
          };
        },
      } as const,
    });

    const { result, rerender } = renderHook(() => useCount());
    let [state, actions, metadata] = result.current;

    expect(useCount).toBeInstanceOf(Function);
    expect(metadata.modificationsCounter).toBe(0);
    expect(metadata.asyncStorageKey).toBeNull();
    expect(metadata.isAsyncStorageReady).toBe(false);

    expect(actions).toBeInstanceOf(Object);
    expect(actions.decrease).toBeInstanceOf(Function);
    expect(actions.increase).toBeInstanceOf(Function);

    expect(state).toBe(1);
    expect(metadata).toEqual({
      asyncStorageKey: null,
      isAsyncStorageReady: false,
      modificationsCounter: 0,
    });

    act(() => {
      actions.increase();
      actions.increase(2);
    });

    rerender();
    [state, actions, metadata] = result.current;

    expect(state).toBe(4);
    expect(metadata).toEqual({
      modificationsCounter: 2,
      isAsyncStorageReady: false,
      asyncStorageKey: null,
    });

    act(() => {
      actions.decrease();
      actions.decrease(2);
    });

    rerender();
    [state, actions, metadata] = result.current;

    expect(state).toBe(1);
    expect(metadata).toEqual({
      asyncStorageKey: null,
      isAsyncStorageReady: false,
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
      callbacks: {
        onInit: onInitSpy,
      },
    });

    expect(onInitSpy).toHaveBeenCalledTimes(1);

    const { result } = renderHook(() => useCount());
    const [state, setState, metadata] = result.current;

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
        callbacks: {
          onSubscribed: onSubscribedSpy,
        },
      }
    );

    expect(onSubscribedSpy).toHaveBeenCalledTimes(0);

    const { result } = renderHook(() => useCount());
    let [state] = result.current;

    expect(onSubscribedSpy).toHaveBeenCalledTimes(1);

    const { result: result2 } = renderHook(() => useCount());
    const [state2] = result2.current;

    expect(onSubscribedSpy).toHaveBeenCalledTimes(2);

    expect(state).toBe(state2);
  });

  it("should execute onStateChanged callback every time the state is changed", () => {
    const onStateChangedSpy = jest.fn();

    const useCount = createGlobalState(
      { a: true },
      {
        callbacks: {
          onStateChanged: onStateChangedSpy,
        },
      }
    );

    expect(onStateChangedSpy).toHaveBeenCalledTimes(0);

    const { result } = renderHook(() => useCount());
    const [, setState, metadata] = result.current;

    /*
     * By default if not metadata is passed, or async storage is not required, the metadata will be null
     */
    expect(metadata).toEqual({
      asyncStorageKey: null,
      isAsyncStorageReady: false,
    });

    act(() => {
      setState({ a: true });
    });

    expect(onStateChangedSpy).toHaveBeenCalledTimes(1);

    act(() => {
      setState({ a: false });
    });

    expect(onStateChangedSpy).toHaveBeenCalledTimes(2);
  });

  it("should execute computePreventStateChange callback before state is changed and continue if it returns false", () => {
    const computePreventStateChangeSpy = jest.fn();

    const useCount = createGlobalState(0, {
      callbacks: {
        computePreventStateChange: computePreventStateChangeSpy,
      },
    });

    expect(computePreventStateChangeSpy).toHaveBeenCalledTimes(0);

    const { result } = renderHook(() => useCount());
    const [state, setState, metadata] = result.current;

    expect(state).toEqual(0);
    expect(setState).toBeInstanceOf(Function);
    expect(metadata).toEqual({
      asyncStorageKey: null,
      isAsyncStorageReady: false,
    });

    act(() => {
      setState((state) => state + 1);
    });

    expect(computePreventStateChangeSpy).toHaveBeenCalledTimes(1);
  });

  it("should execute computePreventStateChange callback before state is changed and prevent state change if it returns true", () => {
    const computePreventStateChangeSpy = jest.fn();

    const useCount = createGlobalState(0, {
      callbacks: {
        computePreventStateChange: (parameters) => {
          computePreventStateChangeSpy();

          const { setState, getMetadata, setMetadata, actions } = parameters;

          expect(getMetadata()).toEqual({
            asyncStorageKey: null,
            isAsyncStorageReady: false,
          });
          expect(setState).toBeInstanceOf(Function);
          expect(setMetadata).toBeInstanceOf(Function);
          expect(actions).toBe(null);

          return true;
        },
      },
    });

    expect(computePreventStateChangeSpy).toHaveBeenCalledTimes(0);

    const { result } = renderHook(() => useCount());
    const [state, setState, metadata] = result.current;

    expect(state).toEqual(0);
    expect(setState).toBeInstanceOf(Function);
    expect(metadata).toEqual({
      asyncStorageKey: null,
      isAsyncStorageReady: false,
    });

    act(() => {
      setState((state) => state + 1);
    });

    expect(computePreventStateChangeSpy).toHaveBeenCalledTimes(1);
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
      callbacks: {
        onStateChanged: onStateChangedSpy,
        onInit: onInitSpy,
      },
    });

    const { result, rerender } = renderHook(() => useCount());
    let [state, setState, metadata] = result.current;

    expect.assertions(5);

    expect(state).toEqual(initialState);
    expect(setState).toBeInstanceOf(Function);
    expect(metadata).toEqual({
      asyncStorageKey: null,
      isAsyncStorageReady: false,
    });

    return mainPromise.then(() => {
      rerender();
      [state, setState, metadata] = result.current;

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

      act(() => {
        setState(
          formatFromStore(stored, {
            jsonParse: true,
          }),
          {
            forceUpdate: true,
          }
        );
      });

      tools.resolve();
    });

    const useCount = createGlobalState(initialState, {
      callbacks: {
        onStateChanged: onStateChangedSpy,
        onInit: onInitSpy,
      },
    });

    const { result, rerender } = renderHook(() => useCount());
    let [state, setState, metadata] = result.current;

    expect(state).toEqual(initialState);
    expect(setState).toBeInstanceOf(Function);
    expect(metadata).toEqual({
      asyncStorageKey: null,
      isAsyncStorageReady: false,
    });

    return mainPromise.then(() => {
      rerender();
      [state, setState, metadata] = result.current;

      expect(state).toEqual(
        new Map([
          [1, { name: "john" }],
          [2, { name: "doe" }],
        ])
      );

      expect(metadata).toEqual({
        isAsyncStorageReady: true,
      });

      expect(onStateChangedSpy).toHaveBeenCalledTimes(1);
      expect(onInitSpy).toHaveBeenCalledTimes(1);

      expect(fakeAsyncStorage.getItem).toHaveBeenCalledTimes(1);
      expect(fakeAsyncStorage.setItem).toHaveBeenCalledTimes(2);

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
      callbacks: {
        onStateChanged: onStateChangedSpy,
        onInit: onInitSpy,
      },
    });

    const { result, rerender } = renderHook(() => useCount());
    let [state, setState, metadata] = result.current;

    expect(state).toEqual(initialState);
    expect(setState).toBeInstanceOf(Function);
    expect(metadata).toEqual({
      asyncStorageKey: null,
      isAsyncStorageReady: false,
    });

    return mainPromise.then(() => {
      rerender();
      [state, setState, metadata] = result.current;

      expect(state).toBe(initialState);

      expect(metadata).toEqual({
        isAsyncStorageReady: true,
      });

      expect(onStateChangedSpy).toHaveBeenCalledTimes(1);
      expect(onInitSpy).toHaveBeenCalledTimes(1);

      expect(fakeAsyncStorage.getItem).toHaveBeenCalledTimes(1);
      expect(fakeAsyncStorage.setItem).toHaveBeenCalledTimes(1);

      expect(fakeAsyncStorage.getItem).toBeCalledWith("items");
    });
  });

  it("should be able to access custom actions from other actions", () => {
    expect.assertions(9);

    const logSpy = jest.fn();

    const useCount = createGlobalState(1, {
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
            const [, actions] = useCount.stateControls();
            setState((state) => state + 1);

            actions.log("increase");
          };
        },
        decrease: () => {
          return ({ setState }) => {
            const [, actions] = useCount.stateControls();

            setState((state) => state - 1);

            actions.log("decrease");
          };
        },
      } as const,
    });

    const [getCount, $actions] = useCount.stateControls();

    const { result, rerender } = renderHook(() => useCount());
    let [state, actions] = result.current;

    expect(state).toEqual(1);
    expect(logSpy).toHaveBeenCalledTimes(0);

    act(() => {
      actions.increase();
    });

    expect(getCount()).toEqual(2);
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toBeCalledWith("increase");

    act(() => {
      actions.decrease();
    });

    expect(getCount()).toEqual(1);
    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(logSpy).toBeCalledWith("decrease");

    act(() => {
      $actions.increase();
    });

    const count = getCount();

    expect(count).toEqual(2);
  });

  it("should be able to create a custom global hook builder", () => {
    let config;

    const onInitSpy = jest.fn((_, _config) => {
      config = _config;
    });

    const onChangeSpy = jest.fn();

    const createGlobal = createCustomGlobalState({
      onInitialize: onInitSpy,
      onChange: onChangeSpy,
    });

    expect(createGlobal).toBeInstanceOf(Function);
    expect(onInitSpy).toHaveBeenCalledTimes(0);
    expect(onChangeSpy).toHaveBeenCalledTimes(0);

    const initialState = {
      count: 1,
    };

    const useCount = createGlobal(initialState, {
      config: {
        someExtraInfo: "someExtraInfo",
      },
    });

    const [getCount, setCount] = useCount.stateControls();

    expect(onInitSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledTimes(0);
    expect(config).toEqual({
      someExtraInfo: "someExtraInfo",
    });

    const { result, rerender } = renderHook(() => useCount());
    let [state, setState, metadata] = result.current;

    expect(state).toEqual(initialState);
    expect(setState).toBeInstanceOf(Function);
    expect(metadata).toEqual({
      asyncStorageKey: null,
      isAsyncStorageReady: false,
    });

    expect(onInitSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledTimes(0);

    expect(getCount()).toEqual(initialState);

    act(() => {
      setCount({
        count: 2,
      });
    });

    expect(getCount()).toEqual({
      count: 2,
    });

    expect(onInitSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);

    rerender();
    [state, setState, metadata] = result.current;

    expect(state).toEqual({
      count: 2,
    });

    expect(setState).toBeInstanceOf(Function);
    expect(metadata).toEqual({
      asyncStorageKey: null,
      isAsyncStorageReady: false,
    });

    expect(onInitSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
  });

  it("should derivate new state from global", () => {
    const useCount = createGlobalState({
      a: 1,
      b: 2,
    });

    const selector = jest.fn((state: { a: number; b: number }) => state.a + state.b);

    const { result, rerender } = renderHook(() => useCount(selector));
    let [derivate, setState] = result.current;

    expect(derivate).toEqual(3);
    expect(selector).toHaveBeenCalledTimes(1);

    act(() => {
      setState((state) => ({
        ...state,
        a: 2,
      }));
    });

    rerender();
    [derivate, setState] = result.current;

    expect(derivate).toEqual(4);
    expect(selector).toHaveBeenCalledTimes(4);
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

    const { result, rerender } = renderHook(() => useData(selector));
    let [derivate, setState] = result.current;

    expect(derivate).toEqual({
      a: 1,
      c: [1, 2, { a: 1 }],
    });

    act(() => {
      setState((state) => ({
        ...state,
        b: 3,
      }));
    });

    rerender();
    [derivate, setState] = result.current;

    expect(derivate).toEqual({
      a: 1,
      c: [1, 2, { a: 1 }],
    });

    const { result: result2, rerender: rerender2 } = renderHook(() => useData());
    let [data] = result2.current;

    expect(data).toEqual({
      a: 1,
      b: 3,
      c: [1, 2, { a: 1 }],
    });

    act(() => {
      setState((state) => ({
        ...state,
        b: 4,
      }));
    });

    rerender();
    [data] = result2.current;

    expect(data).toEqual({
      a: 1,
      b: 4,
      c: [1, 2, { a: 1 }],
    });
  });
});

describe("getter subscriptions", () => {
  it("should subscribe to changes from getter", () => {
    const [getter, setter] = createGlobalState({
      a: 3,
      b: 2,
    }).stateControls();

    const state = getter();

    // without a callback, it should return the current state
    expect(state).toEqual({
      a: 3,
      b: 2,
    });

    const subscriptionSpy = jest.fn();
    const subscriptionDerivateSpy = jest.fn();

    const subscriptions = [
      getter((state) => {
        subscriptionSpy(state);
      }),
      getter(
        (state) => {
          return state.a;
        },
        jest.fn((derivate) => {
          subscriptionDerivateSpy(derivate);
        })
      ),
    ];

    expect(subscriptionSpy).toHaveBeenCalledTimes(1);
    expect(subscriptionSpy).toBeCalledWith(state);

    expect(subscriptionDerivateSpy).toHaveBeenCalledTimes(1);
    expect(subscriptionDerivateSpy).toBeCalledWith(3);

    setter((state) => ({
      ...state,
      b: 3,
    }));

    expect(subscriptionSpy).toHaveBeenCalledTimes(2);
    expect(subscriptionSpy).toBeCalledWith({
      a: 3,
      b: 3,
    });

    // the derivate should not be called since it didn't change
    expect(subscriptionDerivateSpy).toHaveBeenCalledTimes(1);

    subscriptions.forEach((removeSubscription) => removeSubscription());

    setter((state) => ({
      ...state,
      a: 4,
    }));

    // the subscription should not be called since it was removed
    expect(subscriptionSpy).toHaveBeenCalledTimes(2);
    expect(subscriptionDerivateSpy).toHaveBeenCalledTimes(1);
  });
});

describe("create fragment", () => {
  it("should create a fragment as a hook", () => {
    const initialState = {
      a: 1,
      b: 2,
      c: 3 as number | null,
    };

    const useData = createGlobalState(initialState);
    const [getter, setter] = useData.stateControls();

    expect(useData).toBeInstanceOf(Function);
    expect(getter).toBeInstanceOf(Function);
    expect(setter).toBeInstanceOf(Function);

    expect(getter()).toBe(initialState);

    const useDerivate = useData.createSelectorHook(({ a, b }) => {
      return {
        a,
        b,
      };
    });

    const { result, rerender } = renderHook(() => useDerivate());
    let [derivate] = result.current;

    const useSub = useData.createSelectorHook(({ a }) => {
      return a;
    });

    const { result: resultSub, rerender: rerenderSub } = renderHook(() => useSub());
    let [sub] = resultSub.current;

    expect(derivate).toEqual({
      a: 1,
      b: 2,
    });

    expect(sub).toBe(1);

    act(() => {
      setter((state) => ({
        ...state,
        c: null,
        a: 12,
      }));
    });

    rerender();
    [derivate] = result.current;

    expect(derivate).toEqual({
      a: 12,
      b: 2,
    });

    rerenderSub();
    [sub] = resultSub.current;

    expect(sub).toBe(12);
  });

  it("should create a derivate emitter", () => {
    expect.assertions(10);

    const initialState = {
      secondRound: false,
      a: 1,
      b: 2,
      c: 3,
    };

    const useData = createGlobalState(initialState);
    const [getter, setter] = useData.stateControls();

    expect(useData).toBeInstanceOf(Function);
    expect(getter).toBeInstanceOf(Function);
    expect(setter).toBeInstanceOf(Function);

    expect(getter()).toBe(initialState);

    const observable = useData.createObservable(({ a, b, secondRound }) => {
      return {
        secondRound,
        a,
        b,
      };
    });

    observable((derivate) => {
      expect(derivate).toEqual({
        secondRound: derivate.secondRound,
        a: 1,
        b: 2,
      });
    });

    const observable2 = observable.createObservable(({ a, secondRound }) => {
      return {
        secondRound,
        a,
      };
    });

    observable2((derivate) => {
      expect(derivate).toEqual({
        secondRound: derivate.secondRound,
        a: 1,
      });
    });

    const observable3 = observable2.createObservable(({ a }) => {
      return a;
    });

    observable3((derivate) => {
      expect(derivate).toEqual(1);
    });

    observable3(
      (state) => {
        return `${state}`;
      },
      (derivate) => {
        expect(derivate).toEqual("1");
      }
    );

    setter((state) => ({
      ...state,
      secondRound: true,
    }));
  });
});
