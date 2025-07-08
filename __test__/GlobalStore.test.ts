import { createDecoupledPromise } from "easy-cancelable-promise/createDecoupledPromise";
import { CancelablePromise } from "easy-cancelable-promise/CancelablePromise";
import { GlobalStore } from "..";

import { formatFromStore, formatToStore } from "json-storage-formatter";
import { getFakeAsyncStorage } from "./getFakeAsyncStorage";
import { StoreTools } from "react-hooks-global-states";
import { act, renderHook } from "@testing-library/react";

const countStoreInitialState = 1;
const createCountStoreWithActions = (spy?: jest.Mock) => {
  const countStore = new GlobalStore(countStoreInitialState, {
    actions: {
      log(message: string) {
        return (): void => spy?.(message);
      },

      increase(increase: number = 1) {
        return ({ setState, getState }: StoreTools<number>) => {
          setState((state) => state + increase);

          // this also work, the only trouble is that typescript will not recognize the action types
          // and log will be an "any" type
          this.log("increase");

          return getState();
        };
      },

      decrease(decrease: number = 1) {
        return ({ setState, getState }: StoreTools<number>) => {
          setState((state) => state - decrease);

          this.log("decrease");

          return getState();
        };
      },
    },
  });

  return countStore;
};

describe("GlobalStore Basic", () => {
  it("should be able to create a new instance with state", () => {
    const stateValue = "test";
    const store = new GlobalStore(stateValue);

    expect(store).toBeInstanceOf(GlobalStore);
    expect((store as unknown as { stateWrapper: { state: unknown } }).stateWrapper.state).toBe(stateValue);
  });

  it("state setter should be a function", () => {
    const stateValue = "test";
    const store = new GlobalStore(stateValue);

    const [, setState] = store.stateControls();

    expect(setState).toBeInstanceOf(Function);
  });

  it("should be able to get the state", () => {
    const stateValue = 1;
    const store = new GlobalStore(stateValue);

    const [getState] = store.stateControls();

    expect(getState()).toBe(stateValue);
  });

  it("should be able to set the state", () => {
    const stateValue = "test";
    const store = new GlobalStore(stateValue);

    const [, setState] = store.stateControls();

    setState("test2");

    expect((store as unknown as { stateWrapper: { state: unknown } }).stateWrapper.state).toBe("test2");
  });

  it("should be able to set the state with a function", () => {
    const stateValue = "test";
    const store = new GlobalStore(stateValue);

    const [, setState] = store.stateControls();

    setState((state) => `${state}2`);

    expect((store as unknown as { stateWrapper: { state: unknown } }).stateWrapper.state).toBe("test2");
  });

  it("should notify initialize all subscribers of the store", () => {
    const stateValue = "test";
    const stateValue2 = "test2";

    const store = new GlobalStore(stateValue);

    const useHook = store.getHook();
    const [getState, setState] = store.stateControls();

    renderHook(() => useHook());
    renderHook(() => useHook());

    const [[, subscriber1], [__, subscriber2]] = store.subscribers;
    jest.spyOn(subscriber1, "callback");
    jest.spyOn(subscriber2, "callback");

    act(() => {
      setState(stateValue2);
    });

    expect(getState()).toBe(stateValue2);
    expect(subscriber1.callback).toHaveBeenCalledTimes(1);
    expect(subscriber2.callback).toHaveBeenCalledTimes(1);
  });
});

describe("GlobalStore with actions", () => {
  it("should be able to create a new instance with state and actions, setter should be and object", () => {
    const store = createCountStoreWithActions();

    expect(store).toBeInstanceOf(GlobalStore);
    expect(store.stateWrapper.state).toBe(countStoreInitialState);
    expect(store.actionsConfig).toBeDefined();

    const actions = store.getStoreActionsMap()!;

    expect(actions).not.toBeInstanceOf(Function);
    expect(actions.increase).toBeDefined();
  });

  it("should be able to get the state", () => {
    const store = createCountStoreWithActions();

    const [getState] = store.stateControls();

    expect(getState()).toBe(countStoreInitialState);
  });

  it("should be able to set the state", () => {
    const store = createCountStoreWithActions();

    const [getState, actions] = store.stateControls();

    actions.increase();

    expect(getState()).toBe(2);
  });

  it("should initialize all subscribers of the store", () => {
    const store = createCountStoreWithActions();

    const useHook = store.getHook();
    const [getState] = store.stateControls();

    renderHook(() => useHook());
    renderHook(() => useHook());

    const [[, subscriber1], [__, subscriber2]] = store.subscribers;
    jest.spyOn(subscriber1, "callback");
    jest.spyOn(subscriber2, "callback");

    expect(getState()).toBe(countStoreInitialState);
    expect(subscriber1.callback).toHaveBeenCalledTimes(0);
    expect(subscriber2.callback).toHaveBeenCalledTimes(0);
  });

  it("should update all subscribers of the store", () => {
    const store = createCountStoreWithActions();

    const useHook = store.getHook();
    const [getState, actions] = store.stateControls();

    renderHook(() => useHook());
    renderHook(() => useHook());

    const [[, subscriber1], [__, subscriber2]] = store.subscribers;
    jest.spyOn(subscriber1, "callback");
    jest.spyOn(subscriber2, "callback");

    act(() => {
      actions.increase();
    });

    expect(getState()).toBe(2);
    expect(subscriber1.callback).toHaveBeenCalledTimes(1);
    expect(subscriber2.callback).toHaveBeenCalledTimes(1);
  });
});

describe("GlobalStore with configuration callbacks", () => {
  it("should execute onInit callback", () => {
    expect.assertions(6);

    const initialState = { count: 0 };
    const onInitSpy = jest.fn();

    new GlobalStore(initialState, {
      callbacks: {
        onInit: (parameters) => {
          onInitSpy();

          const { setState, getState, getMetadata, setMetadata, actions } = parameters;

          expect(getState()).toEqual(initialState);
          expect(getMetadata()).toEqual({
            asyncStorageKey: null,
            isAsyncStorageReady: false,
          });
          expect(setState).toBeInstanceOf(Function);
          expect(setMetadata).toBeInstanceOf(Function);
          expect(actions).toBe(null);
        },
      },
    });

    expect(onInitSpy).toHaveBeenCalledTimes(1);
  });

  it("should execute onInit callback with metadata", () => {
    expect.assertions(3);

    const initialState = { count: 0 };
    const onInitSpy = jest.fn();

    new GlobalStore(initialState, {
      callbacks: {
        onInit: (parameters) => {
          onInitSpy();

          const { getMetadata, setMetadata } = parameters;

          expect(getMetadata()).toEqual({
            asyncStorageKey: null,
            isAsyncStorageReady: false,
          });

          setMetadata({
            isAsyncStorageReady: true,
          });

          expect(getMetadata()).toEqual({
            isAsyncStorageReady: true,
          });
        },
      },
    });

    expect(onInitSpy).toHaveBeenCalledTimes(1);
  });

  it("should execute onSubscribed callback every time a subscriber is added", () => {
    expect.assertions(18);

    let onSubscribedSpy = jest.fn();

    const store = new GlobalStore(
      { count: 0 },
      {
        callbacks: {
          onSubscribed: (parameters) => {
            onSubscribedSpy();

            const { setState, getState, getMetadata, setMetadata, actions } = parameters;

            // this code will be execute 3 times
            expect(getMetadata()).toEqual({
              asyncStorageKey: null,
              isAsyncStorageReady: false,
            });
            expect(setState).toBeInstanceOf(Function);
            expect(setMetadata).toBeInstanceOf(Function);
            expect(actions).toBe(null);
            expect(getState()).toEqual({ count: 0 });
          },
        },
      }
    );

    expect(onSubscribedSpy).toHaveBeenCalledTimes(0);

    const useStore = store.getHook();

    renderHook(() => useStore());

    expect(onSubscribedSpy).toHaveBeenCalledTimes(1);

    renderHook(() => useStore());
    renderHook(() => useStore());

    expect(onSubscribedSpy).toHaveBeenCalledTimes(3);
  });

  it("should execute onStateChanged callback every time the state is changed", () => {
    expect.assertions(7);

    const onStateChangedSpy = jest.fn();

    const store = new GlobalStore(
      { count: 0 },
      {
        callbacks: {
          onStateChanged: (parameters) => {
            onStateChangedSpy();

            const { setState, getState, getMetadata, setMetadata, actions } = parameters;

            expect(getMetadata()).toEqual({
              asyncStorageKey: null,
              isAsyncStorageReady: false,
            });
            expect(setState).toBeInstanceOf(Function);
            expect(setMetadata).toBeInstanceOf(Function);
            expect(actions).toBe(null);
            expect(getState()).toEqual({ count: 1 });
          },
        },
      }
    );

    expect(onStateChangedSpy).toHaveBeenCalledTimes(0);

    const [, setState] = store.stateControls();

    setState((state) => ({ count: state.count + 1 }));

    expect(onStateChangedSpy).toHaveBeenCalledTimes(1);
  });

  it("should execute computePreventStateChange callback before state is changed and continue if it returns false", () => {
    expect.assertions(7);

    const computePreventStateChangeSpy = jest.fn();

    const store = new GlobalStore(
      { count: 0 },
      {
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

            return false;
          },
        },
      }
    );

    expect(computePreventStateChangeSpy).toHaveBeenCalledTimes(0);

    const [getState, setState] = store.stateControls();

    setState((state) => ({ count: state.count + 1 }));

    expect(computePreventStateChangeSpy).toHaveBeenCalledTimes(1);
    expect(getState()).toEqual({ count: 1 });
  });

  it("should execute computePreventStateChange callback before state is changed and prevent state change if it returns true", () => {
    expect.assertions(7);

    const computePreventStateChangeSpy = jest.fn();

    const store = new GlobalStore(
      { count: 0 },
      {
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
      }
    );

    expect(computePreventStateChangeSpy).toHaveBeenCalledTimes(0);

    const [getState, setState] = store.stateControls();

    setState((state) => ({ count: state.count + 1 }));

    expect(computePreventStateChangeSpy).toHaveBeenCalledTimes(1);
    expect(getState()).toEqual({ count: 0 });
  });
});

describe("Custom store by using config parameter", () => {
  const getInitialState = () => {
    return new Map([
      [1, { name: "john" }],
      [2, { name: "doe" }],
    ]);
  };

  it("should initialize the store with the initial state where there is no async storage data", async () => {
    const initialState = getInitialState();
    const { fakeAsyncStorage } = getFakeAsyncStorage();

    const onStateChangedSpy = jest.fn();
    const onInitSpy = jest.fn();

    const { promise: mainPromise, ...tools } = createDecoupledPromise();

    let store: GlobalStore<any, any, any>;

    setTimeout(async () => {
      await new CancelablePromise<void>((resolve) => {
        store = new GlobalStore(initialState, {
          callbacks: {
            onInit: async (parameters) => {
              onInitSpy();

              const { setMetadata, setState } = parameters;

              const stored = (await fakeAsyncStorage.getItem("items")) ?? null;

              setMetadata({
                isAsyncStorageReady: true,
              });

              if (!stored) {
                resolve();

                return;
              }

              const items = formatFromStore(JSON.parse(stored)) as Map<number, { name: string }>;

              setState(items);
              resolve();
            },
            onStateChanged: ({ getState }) => {
              onStateChangedSpy();

              const newState = getState();

              fakeAsyncStorage.setItem("items", formatToStore(newState));
            },
          },
        });
      });

      const [getState] = store.stateControls();

      expect(onInitSpy).toHaveBeenCalledTimes(1);
      expect(onStateChangedSpy).toHaveBeenCalledTimes(0);
      expect(fakeAsyncStorage.getItem).toHaveBeenCalledTimes(1);
      expect(getState()).toEqual(initialState);

      tools.resolve();
    }, 0);

    return mainPromise;
  });

  it("should initialize the store with the async storage data where there is async storage data", async () => {
    const initialState = getInitialState();
    const { fakeAsyncStorage } = getFakeAsyncStorage();
    const onStateChangedSpy = jest.fn();
    const onInitSpy = jest.fn();

    const { promise: mainPromise, ...tools } = createDecoupledPromise();

    const storedMap = new Map(initialState);
    storedMap.set(3, { name: "jane" });

    fakeAsyncStorage.setItem("items", formatToStore(storedMap));

    setTimeout(async () => {
      let store!: GlobalStore<any, any, any>;

      await new CancelablePromise<void>((resolve) => {
        store = new GlobalStore(initialState, {
          callbacks: {
            onInit: async (parameters) => {
              onInitSpy();

              const { setMetadata, setState } = parameters;

              const stored = (await fakeAsyncStorage.getItem("items")) ?? null;

              setMetadata({
                isAsyncStorageReady: true,
              });

              if (!stored) {
                resolve();

                return;
              }

              const items = formatFromStore(JSON.parse(stored)) as Map<number, { name: string }>;

              setState(items);
              resolve();
            },
            onStateChanged: ({ getState }) => {
              onStateChangedSpy();

              const newState = getState();

              fakeAsyncStorage.setItem("items", formatToStore(newState));
            },
          },
        });
      });

      const [getState] = store.stateControls();

      expect(onInitSpy).toHaveBeenCalledTimes(1);
      expect(onStateChangedSpy).toHaveBeenCalledTimes(1);
      expect(fakeAsyncStorage.getItem).toHaveBeenCalledTimes(1);

      expect(getState()).toEqual(storedMap);

      tools.resolve();
    }, 0);

    return mainPromise;
  });

  it("should be able to update the store async storage", async () => {
    const initialState = getInitialState();
    const { fakeAsyncStorage } = getFakeAsyncStorage();

    const { promise: mainPromise, ...tools } = createDecoupledPromise();
    const { promise: onStateChangedPromise, ...toolsOnStateChangedPromise } = createDecoupledPromise();

    setTimeout(async () => {
      let store!: GlobalStore<any, any, null>;

      await new CancelablePromise<void>((resolve) => {
        store = new GlobalStore(initialState, {
          callbacks: {
            onInit: async (parameters) => {
              const { setMetadata, setState } = parameters;
              const stored = (await fakeAsyncStorage.getItem("items")) ?? null;

              setMetadata({
                isAsyncStorageReady: true,
              });

              if (!stored) {
                resolve();

                return;
              }

              const items = formatFromStore(JSON.parse(stored)) as Map<number, { name: string }>;

              setState(items);
              resolve();
            },
            onStateChanged: async ({ getState }) => {
              const newState = getState();

              await fakeAsyncStorage.setItem("items", formatToStore(newState));

              toolsOnStateChangedPromise.resolve();
            },
          },
        });
      });

      const [getState, setState] = store.stateControls();

      const newState = new Map(getState());
      newState.set(3, { name: "jane" });

      setState(newState);

      expect(fakeAsyncStorage.getItem).toHaveBeenCalledTimes(1);
      expect(getState()).toEqual(newState);

      await onStateChangedPromise;

      const stored = await fakeAsyncStorage.getItem("items");

      expect(stored).toEqual(
        '{"$t":"map","$v":[[1,{"name":"john"}],[2,{"name":"doe"}],[3,{"name":"jane"}]]}'
      );

      const { result } = renderHook(() => store.getHook()());
      const [state] = result.current;

      expect(state).toEqual(newState);

      tools.resolve();
    }, 0);

    return mainPromise;
  });
});

describe("GlobalStore Accessing custom actions from other actions", () => {
  it("should be able to access custom actions from other actions", () => {
    expect.assertions(8);

    const logSpy = jest.fn();

    const store = createCountStoreWithActions(logSpy);

    const [getState, actions] = store.stateControls();

    expect(getState()).toEqual(1);
    expect(logSpy).toHaveBeenCalledTimes(0);

    actions.increase();

    expect(getState()).toEqual(2);
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toBeCalledWith("increase");

    actions.decrease();

    expect(getState()).toEqual(1);
    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(logSpy).toBeCalledWith("decrease");
  });
});
