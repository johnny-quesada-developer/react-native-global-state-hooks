import { createDecoupledPromise } from "easy-cancelable-promise/createDecoupledPromise";
import { formatToStore } from "json-storage-formatter/formatToStore";
import { getFakeAsyncStorage } from "./getFakeAsyncStorage";
import { GlobalStore, createGlobalState, asyncStorageWrapper } from "..";

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

      const useStorage = storage.getHook();

      const [getState, _, getMetadata] = useStorage.stateControls();

      const onStateChanged = Object.getOwnPropertyDescriptor(storage, "onStateChanged")?.value;

      onStateChanged.bind(storage);

      jest
        .spyOn(
          storage as unknown as {
            onStateChanged: () => void;
          },
          "onStateChanged"
        )
        .mockImplementation((...parameters) => {
          onStateChanged(...parameters);
          onStateChangedResolve();
        });

      expect(storage).toBeInstanceOf(GlobalStore);

      expect(getMetadata().isAsyncStorageReady).toBe(false);

      await onStateChangedPromise;

      expect(getMetadata().isAsyncStorageReady).toBe(true);
      expect(getState()).toBe(0);

      const storedValue = await asyncStorage.getItem("counter");

      expect(storedValue).toBe('"0"');

      resolve();
    }, 0);

    return promise;
  });
});

describe("createGlobalState", () => {
  it("should create a store with async storage", async () => {
    asyncStorage.setItem("data", formatToStore(new Map([["prop", 0]])));

    const { promise, resolve } = createDecoupledPromise();

    setTimeout(async () => {
      const { promise: onStateChangedPromise, resolve: onStateChangedResolve } = createDecoupledPromise();

      const useData = createGlobalState(new Map<string, number>(), {
        asyncStorage: {
          key: "data",
        },
        callbacks: {
          onStateChanged: onStateChangedResolve,
        },
      });

      let [data, setData, metadata] = useData();

      expect(metadata.isAsyncStorageReady).toBe(false);

      await onStateChangedPromise;

      [data, setData, metadata] = useData();

      expect(!!metadata.isAsyncStorageReady).toBe(true);
      expect(data).toEqual(new Map([["prop", 0]]));

      setData((data) => {
        data.set("prop", 1);

        return data;
      });

      const [data2] = useData();

      expect(data).toBe(data2);

      resolve();
    }, 0);

    return promise;
  });
});

describe("getter subscriptions custom global state", () => {
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
      getter(
        (state) => {
          return state.a;
        },
        (derivate) => {
          subscriptionDerivateSpy(derivate);
        }
      ),
      getter((state) => {
        subscriptionSpy(state);
      }),
    ];

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

    subscriptions.forEach((removeSubscription) => removeSubscription());

    setter((state) => ({
      ...state,
      a: 4,
    }));

    // the subscription should not be called since it was removed
    expect(subscriptionSpy).toBeCalledTimes(2);
    expect(subscriptionDerivateSpy).toBeCalledTimes(1);
  });
});
