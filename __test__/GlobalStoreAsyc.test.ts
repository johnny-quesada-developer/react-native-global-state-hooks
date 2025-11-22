import { createDecoupledPromise } from "easy-cancelable-promise/createDecoupledPromise";
import formatToStore from "json-storage-formatter/formatToStore";
import { getFakeAsyncStorage } from "./getFakeAsyncStorage";
import { GlobalStore, createGlobalState, asyncStorageWrapper } from "..";
// import { GlobalStore, createGlobalState, asyncStorageWrapper } from "../src";
import { act } from "@testing-library/react";
import it from "./$it";

export const { fakeAsyncStorage: asyncStorage } = getFakeAsyncStorage();

asyncStorageWrapper.addAsyncStorageManager(() => Promise.resolve(asyncStorage));

describe("GlobalStoreAsync Basics", () => {
  it("should create a store with async storage", async () => {
    asyncStorage.setItem("counter", 0);

    const { promise, resolve } = createDecoupledPromise();

    setTimeout(async () => {
      const { promise: onStateChangedPromise, resolve: onStateChangedResolve } = createDecoupledPromise();

      const storage = new GlobalStore(0, {
        asyncStorage: {
          key: "counter",
        },
      });

      const onStateChanged = Object.getOwnPropertyDescriptor(storage, "onStateChanged")?.value;

      onStateChanged.bind(storage);

      jest
        .spyOn(
          storage as unknown as {
            onStateChanged: () => void;
          },
          "onStateChanged",
        )
        .mockImplementation((...parameters) => {
          onStateChanged(...parameters);
          onStateChangedResolve();
        });

      expect(storage).toBeInstanceOf(GlobalStore);

      expect(storage.getMetadata().isAsyncStorageReady).toBe(false);

      await onStateChangedPromise;

      expect(storage.getMetadata().isAsyncStorageReady).toBe(true);
      expect(storage.getState()).toBe(0);

      const storedValue = await asyncStorage.getItem("counter");

      expect(storedValue).toBe("0");

      resolve();
    }, 0);

    return promise;
  });

  it("should correctly restore the state from async storage", async ({ renderHook }) => {
    expect.assertions(2);
    asyncStorage.setItem("counter", 25);

    const { promise, resolve } = createDecoupledPromise();

    setTimeout(async () => {
      const { promise: onStateChangedPromise, resolve: onStateChangedResolve } = createDecoupledPromise();

      const store = new GlobalStore(0, {
        asyncStorage: {
          key: "counter",
        },
      });

      const { result, rerender } = renderHook(() => store.use());
      let [state] = result.current;

      const [subscriber1] = store.subscribers;
      const callback = subscriber1.onStoreChange;
      jest.spyOn(subscriber1, "onStoreChange").mockImplementation((...args) => {
        act(() => {
          (callback as (...args: unknown[]) => void)(...args);
        });
      });

      expect(state).toBe(0);

      const onStateChanged = Object.getOwnPropertyDescriptor(store, "onStateChanged")?.value;

      onStateChanged.bind(store);

      jest
        .spyOn(
          store as unknown as {
            onStateChanged: () => void;
          },
          "onStateChanged",
        )
        .mockImplementation((...parameters) => {
          onStateChanged(...parameters);
          onStateChangedResolve();
        });

      await onStateChangedPromise;

      rerender();
      [state] = result.current;

      expect(state).toBe(25);

      resolve();
    }, 0);

    return promise;
  });

  it("should rerender even if the restored state is the same", async ({ renderHook }) => {
    expect.assertions(4);
    asyncStorage.setItem("counter", 1);

    const { promise, resolve } = createDecoupledPromise();

    setTimeout(async () => {
      const { promise: onStateChangedPromise, resolve: onStateChangedResolve } = createDecoupledPromise();

      const store = new GlobalStore(1, {
        asyncStorage: {
          key: "counter",
        },
      });

      const { result, rerender } = renderHook(() => store.use());
      let [state, , metadata] = result.current;

      const [subscriber1] = store.subscribers;
      const callback = subscriber1.onStoreChange;
      jest.spyOn(subscriber1, "onStoreChange").mockImplementation((...args) => {
        act(() => {
          (callback as (...args: unknown[]) => void)(...args);
        });
      });

      expect(state).toBe(1);
      expect(metadata.isAsyncStorageReady).toBe(false);

      const onStateChanged = Object.getOwnPropertyDescriptor(store, "onStateChanged")?.value;

      onStateChanged.bind(store);

      jest
        .spyOn(
          store as unknown as {
            onStateChanged: () => void;
          },
          "onStateChanged",
        )
        .mockImplementation((...parameters) => {
          onStateChanged(...parameters);
          onStateChangedResolve();
        });

      await onStateChangedPromise;

      rerender();
      [state, , metadata] = result.current;

      expect(state).toBe(1);
      expect(metadata.isAsyncStorageReady).toBe(true);

      resolve();
    }, 0);

    return promise;
  });

  it("should create a store with async storage", async () => {
    asyncStorage.setItem("counter", 0);

    const { promise, resolve } = createDecoupledPromise();

    setTimeout(async () => {
      const { promise: onStateChangedPromise, resolve: onStateChangedResolve } = createDecoupledPromise();

      const storage = new GlobalStore(0, {
        asyncStorage: {
          key: "counter",
        },
      });

      const onStateChanged = Object.getOwnPropertyDescriptor(storage, "onStateChanged")?.value;

      onStateChanged.bind(storage);

      jest
        .spyOn(
          storage as unknown as {
            onStateChanged: () => void;
          },
          "onStateChanged",
        )
        .mockImplementation((...parameters) => {
          onStateChanged(...parameters);
          onStateChangedResolve();
        });

      expect(storage).toBeInstanceOf(GlobalStore);

      expect(storage.getMetadata().isAsyncStorageReady).toBe(false);

      await onStateChangedPromise;

      expect(storage.getMetadata().isAsyncStorageReady).toBe(true);
      expect(storage.getState()).toBe(0);

      const storedValue = await asyncStorage.getItem("counter");

      expect(storedValue).toBe("0");

      resolve();
    }, 0);

    return promise;
  });
});

describe("createGlobalState", () => {
  it("should create a store with async storage", async ({ renderHook }) => {
    asyncStorage.setItem("data", formatToStore(new Map([["prop", 0]])));

    const { promise, resolve } = createDecoupledPromise();

    setTimeout(async () => {
      const { promise: onStateChangedPromise, resolve: onStateChangedResolve } = createDecoupledPromise();

      const store = new GlobalStore(new Map<string, number>(), {
        asyncStorage: {
          key: "data",
        },
        callbacks: {
          onStateChanged: onStateChangedResolve,
        },
      });

      const { result, rerender } = renderHook(() => store.use());
      let [data, setData, metadata] = result.current;

      const [subscriber1] = store.subscribers;
      const callback = subscriber1.onStoreChange;
      jest.spyOn(subscriber1, "onStoreChange").mockImplementation((...args) => {
        act(() => {
          (callback as (...args: unknown[]) => void)(...args);
        });
      });

      expect(metadata.isAsyncStorageReady).toBe(false);

      await onStateChangedPromise;

      rerender();
      [data, setData, metadata] = result.current;

      expect(!!metadata.isAsyncStorageReady).toBe(true);
      expect(data).toEqual(new Map([["prop", 0]]));

      act(() => {
        setData((data) => {
          data.set("prop", 1);

          return data;
        });
      });

      const { result: result2 } = renderHook(() => store.use());
      const [data2] = result2.current;

      expect(data).toBe(data2);

      resolve();
    }, 0);

    return promise;
  });
});

describe("getter subscriptions custom global state", () => {
  it("should subscribe to changes from getter", () => {
    const store = createGlobalState({
      a: 3,
      b: 2,
    });

    const state = store.getState();

    // without a callback, it should return the current state
    expect(state).toEqual({
      a: 3,
      b: 2,
    });

    const subscriptionSpy = jest.fn();
    const subscriptionDerivateSpy = jest.fn();

    const subscriptions = [
      store.subscribe(
        (state) => {
          return state.a;
        },
        (derivate) => {
          subscriptionDerivateSpy(derivate);
        },
      ),
      store.subscribe((state) => {
        subscriptionSpy(state);
      }),
    ];

    expect(subscriptionSpy).toHaveBeenCalledTimes(1);
    expect(subscriptionSpy).toHaveBeenCalledWith(state);

    expect(subscriptionDerivateSpy).toHaveBeenCalledTimes(1);
    expect(subscriptionDerivateSpy).toHaveBeenCalledWith(3);

    act(() => {
      store.setState((state) => ({
        ...state,
        b: 3,
      }));
    });

    expect(subscriptionSpy).toHaveBeenCalledTimes(2);
    expect(subscriptionSpy).toHaveBeenCalledWith({
      a: 3,
      b: 3,
    });

    // the derivate should not be called since it didn't change
    expect(subscriptionDerivateSpy).toHaveBeenCalledTimes(1);

    subscriptions.forEach((removeSubscription) => removeSubscription());

    act(() => {
      store.subscribe((state) => ({
        ...state,
        a: 4,
      }));
    });

    // the subscription should not be called since it was removed
    expect(subscriptionSpy).toHaveBeenCalledTimes(2);
    expect(subscriptionDerivateSpy).toHaveBeenCalledTimes(1);
  });
});
