import { createDecoupledPromise } from "easy-cancelable-promise/createDecoupledPromise";

// import { GlobalStore, createGlobalState, asyncStorageWrapper } from "..";
import { GlobalStore, createGlobalState, asyncStorageWrapper } from "../src";
import formatToStore from "json-storage-formatter/formatToStore";
import { getFakeAsyncStorage } from "./getFakeAsyncStorage";
import { act } from "@testing-library/react";
import it from "./$it";

export const { fakeAsyncStorage: asyncStorage } = getFakeAsyncStorage();
asyncStorageWrapper.addAsyncStorageManager(() => Promise.resolve(asyncStorage));

describe("GlobalStoreAsync Basics", () => {
  it("should create a store with async storage", () => {
    asyncStorage.setItem("counter", 0 as unknown as string);

    const { promise, resolve } = createDecoupledPromise();

    setTimeout(async () => {
      const { promise: onStateChangedPromise, resolve: onStateChangedResolve } = createDecoupledPromise();

      const store = new GlobalStore(0, {
        asyncStorage: {
          key: "counter",
          validator: () => {},
        },
        metadata: {},
      });

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

      expect(store).toBeInstanceOf(GlobalStore);

      expect(store.getMetadata().isAsyncStorageReady).toBe(false);

      await onStateChangedPromise;

      expect(store.getMetadata().isAsyncStorageReady).toBe(true);

      act(() => {
        store.setState((state) => state + 1);
      });

      // time for the async storage to update
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(store.getState()).toBe(1);

      const storedValue = await asyncStorage.getItem("counter");

      expect(storedValue).toBe("1");

      resolve();
    }, 0);

    return promise;
  });
});

describe("createGlobalState", () => {
  it("should create a store with async storage", async ({ renderHook }) => {
    asyncStorage.setItem("data", formatToStore(new Map([["prop", 0]])) as unknown as string);

    const { promise, resolve } = createDecoupledPromise();

    setTimeout(async () => {
      const { promise: onStateChangedPromise, resolve: onStateChangedResolve } = createDecoupledPromise();

      const store = new GlobalStore(new Map<string, number>(), {
        asyncStorage: {
          key: "data",
          validator: () => {},
        },
        metadata: {},
        callbacks: {
          onStateChanged: onStateChangedResolve,
        },
      });

      const { result, rerender } = renderHook(() => store.use());
      let [data, setData, metadata] = result.current;

      expect(metadata?.isAsyncStorageReady).toBe(false);

      const [subscriber1] = store.subscribers;
      const callback = subscriber1.onStoreChange;
      jest.spyOn(subscriber1, "onStoreChange").mockImplementation((...args) => {
        act(() => {
          (callback as (...args: unknown[]) => void)(...args);
        });
      });

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
      store.subscribe((state) => {
        subscriptionSpy(state);
      }),
      store.subscribe(
        (state) => {
          return state.a;
        },
        jest.fn((derivate) => {
          subscriptionDerivateSpy(derivate);
        }),
      ),
    ];

    expect(subscriptionSpy).toHaveBeenCalledTimes(1);
    expect(subscriptionSpy).toBeCalledWith(state);

    expect(subscriptionDerivateSpy).toHaveBeenCalledTimes(1);
    expect(subscriptionDerivateSpy).toBeCalledWith(3);

    act(() => {
      store.setState((state) => ({
        ...state,
        b: 3,
      }));
    });

    expect(subscriptionSpy).toHaveBeenCalledTimes(2);
    expect(subscriptionSpy).toBeCalledWith({
      a: 3,
      b: 3,
    });

    // the derivate should not be called since it didn't change
    expect(subscriptionDerivateSpy).toHaveBeenCalledTimes(1);

    subscriptions.forEach((unsubscribe) => unsubscribe());

    act(() => {
      store.setState((state) => ({
        ...state,
        a: 4,
      }));
    });

    // the subscription should not be called since it was removed
    expect(subscriptionSpy).toHaveBeenCalledTimes(2);
    expect(subscriptionDerivateSpy).toHaveBeenCalledTimes(1);
  });
});
