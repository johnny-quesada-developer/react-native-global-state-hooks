import { createDecoupledPromise } from "easy-cancelable-promise/createDecoupledPromise";
import formatToStore from "json-storage-formatter/formatToStore";
import { getFakeAsyncStorage } from "./getFakeAsyncStorage";
import { GlobalStore, createGlobalState, asyncStorageWrapper } from "..";
// import { GlobalStore, createGlobalState, asyncStorageWrapper } from "../src";
import { act } from "@testing-library/react";
import it from "./$it";
import tryCatch from "../src/tryCatch";

export const { fakeAsyncStorage: asyncStorage } = getFakeAsyncStorage();

asyncStorageWrapper.addAsyncStorageManager(() => Promise.resolve(asyncStorage));

describe("GlobalStoreAsync Basics", () => {
  it("should create a store with async storage", async () => {
    asyncStorage.setItem("counter", { s: 0, v: -1 });

    const { promise, resolve, reject } = createDecoupledPromise();

    queueMicrotask(async () => {
      const { error } = await tryCatch(async () => {
        const {
          promise: onStateChangedPromise,
          resolve: onStateChangedResolve,
          reject: onStateChangedReject,
        } = createDecoupledPromise();

        const storage = new GlobalStore(0, {
          asyncStorage: {
            key: "counter",
            validator: () => {},
            onError: (err) => {
              onStateChangedReject(err);
            },
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

        // wait two ticks to ensure the isAsyncStorageReady flag is set
        await new Promise((r) => setTimeout(r, 2));

        expect(storage.getMetadata().isAsyncStorageReady).toBe(true);
        expect(storage.getState()).toBe(0);

        const storedValue = await asyncStorage.getItem("counter");

        expect(storedValue).toBe('{"s":0,"v":-1}');
      });

      if (error) return reject(error);

      resolve();
    });

    return promise;
  });

  it("should correctly restore the state from async storage", async ({ renderHook }) => {
    expect.assertions(2);

    asyncStorage.setItem("counter", { s: 25, v: -1 });

    const { promise, resolve, reject } = createDecoupledPromise();

    queueMicrotask(async () => {
      const { error } = await tryCatch(async () => {
        const {
          promise: onStateChangedPromise,
          resolve: onStateChangedResolve,
          reject: onStateChangedReject,
        } = createDecoupledPromise();

        const store = new GlobalStore(0, {
          asyncStorage: {
            key: "counter",
            validator: () => {},
            onError: (err) => {
              onStateChangedReject(err);
            },
          },
        });

        const { result } = renderHook(() => store.use());
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

        // wait two ticks to ensure the isAsyncStorageReady flag is set
        await new Promise((r) => setTimeout(r, 2));

        [state] = result.current;

        expect(state).toBe(25);
      });

      if (error) reject(error);

      resolve();
    });

    return promise;
  });

  it("should rerender even if the restored state is the same", async ({ renderHook }) => {
    expect.assertions(4);
    asyncStorage.setItem("counter", { s: 1, v: -1 });

    const { promise, resolve, reject } = createDecoupledPromise();

    queueMicrotask(async () => {
      const {
        promise: onStateChangedPromise,
        resolve: onStateChangedResolve,
        reject: onStateChangedReject,
      } = createDecoupledPromise();

      const { error } = await tryCatch(async () => {
        const store = new GlobalStore(1, {
          asyncStorage: {
            key: "counter",
            validator: () => {},
            onError: (err) => {
              onStateChangedReject(err);
            },
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

        // wait two ticks to ensure the isAsyncStorageReady flag is set
        await new Promise((r) => setTimeout(r, 2));

        rerender();
        [state, , metadata] = result.current;

        expect(state).toBe(1);
        expect(metadata.isAsyncStorageReady).toBe(true);
      });

      if (error) return reject(error);

      resolve();
    });

    return promise;
  });

  it("should create a store with async storage", async () => {
    asyncStorage.setItem("counter", { s: 0, v: -1 });

    const { promise, resolve } = createDecoupledPromise();

    setTimeout(async () => {
      const { promise: onStateChangedPromise, resolve: onStateChangedResolve } = createDecoupledPromise();

      const storage = new GlobalStore(0, {
        asyncStorage: {
          key: "counter",
          validator: () => {},
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

      // wait two ticks to ensure the isAsyncStorageReady flag is set
      await new Promise((r) => setTimeout(r, 2));

      expect(storage.getMetadata().isAsyncStorageReady).toBe(true);
      expect(storage.getState()).toBe(0);

      const storedValue = await asyncStorage.getItem("counter");

      expect(storedValue).toBe('{"s":0,"v":-1}');

      resolve();
    }, 0);

    return promise;
  });
});

describe("createGlobalState", () => {
  it("should create a store with async storage", async ({ renderHook }) => {
    asyncStorage.setItem(
      "data",
      formatToStore({
        s: new Map([["prop", 0]]),
        v: -1,
      }),
    );

    const { promise, resolve } = createDecoupledPromise();

    setTimeout(async () => {
      const { promise: onStateChangedPromise, resolve: onStateChangedResolve } = createDecoupledPromise();

      const store = new GlobalStore(new Map<string, number>(), {
        asyncStorage: {
          key: "data",
          validator: () => {},
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

      // wait two ticks to ensure the isAsyncStorageReady flag is set
      await new Promise((r) => setTimeout(r, 2));

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

  it("should override restored value with validator returning new state", async () => {
    expect.assertions(2);
    asyncStorage.setItem("counter", { s: "invalid", v: -1 });

    const { promise, resolve, reject } = createDecoupledPromise();

    queueMicrotask(async () => {
      const { error } = await tryCatch(async () => {
        const {
          promise: onStateChangedPromise,
          resolve: onStateChangedResolve,
          reject: onStateChangedReject,
        } = createDecoupledPromise();

        const store = new GlobalStore(0, {
          asyncStorage: {
            key: "counter",
            validator: () => {
              return 25;
            },
            onError: (err) => {
              onStateChangedReject(err);
            },
          },
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

        expect(store.getState()).toBe(0);

        await onStateChangedPromise;

        // wait two ticks to ensure the isAsyncStorageReady flag is set
        await new Promise((r) => setTimeout(r, 2));

        expect(store.getState()).toBe(25);
      });

      if (error) return reject(error);

      resolve();
    });

    return promise;
  });

  it("should execute migrator when version differs", async () => {
    expect.assertions(2);
    asyncStorage.setItem("counter", { s: "invalid", v: -1 });

    const { promise, resolve, reject } = createDecoupledPromise();

    queueMicrotask(async () => {
      const { error } = await tryCatch(async () => {
        const {
          promise: onStateChangedPromise,
          resolve: onStateChangedResolve,
          reject: onStateChangedReject,
        } = createDecoupledPromise();

        const store = new GlobalStore(0, {
          asyncStorage: {
            key: "counter",
            versioning: {
              version: 1,
              migrator: () => {
                return 25;
              },
            },
            validator: () => {},
            onError: (err) => {
              onStateChangedReject(err);
            },
          },
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

        expect(store.getState()).toBe(0);

        await onStateChangedPromise;

        // wait two ticks to ensure the isAsyncStorageReady flag is set
        await new Promise((r) => setTimeout(r, 2));

        expect(store.getState()).toBe(25);
      });

      if (error) return reject(error);

      resolve();
    });

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
