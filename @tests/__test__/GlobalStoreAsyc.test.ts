import { createDecoupledPromise } from 'cancelable-promise-jq';
import { formatToStore } from 'json-storage-formatter';
import {
  GlobalStore,
  asyncStorage,
  createGlobalState,
} from './GlobalStoreAsync';

describe('GlobalStoreAsync Basics', () => {
  it('should create a store with async storage', async () => {
    asyncStorage.setItem('counter', 0);

    const { promise, resolve } = createDecoupledPromise();

    setTimeout(async () => {
      const { promise: onStateChangedPromise, resolve: onStateChangedResolve } =
        createDecoupledPromise();

      const storage = new GlobalStore(0, {
        metadata: {
          asyncStorageKey: 'counter',
          isAsyncStorageReady: false,
        },
      });

      const [getState, _, getMetadata] = storage.getHookDecoupled();

      const onStateChanged = (storage as any).onStateChanged;
      onStateChanged.bind(storage);

      jest
        .spyOn(storage, 'onStateChanged' as any)
        .mockImplementation((...parameters) => {
          onStateChanged(...parameters);

          onStateChangedResolve();
        });

      expect(storage).toBeInstanceOf(GlobalStore);

      expect(getMetadata().isAsyncStorageReady).toBe(false);

      // add a subscriber to the store
      storage.getHook()();

      const [setter] = storage.subscribers;
      const setState = jest.fn(setter);

      storage.subscribers = new Set([setState]);

      await onStateChangedPromise;

      expect(getMetadata().isAsyncStorageReady).toBe(true);
      expect(setState).toBeCalledTimes(1);

      expect(getState()).toBe(0);

      const storedValue = await asyncStorage.getItem('counter');

      expect(storedValue).toBe('"0"');

      resolve();
    }, 0);

    return promise;
  });
});

describe('createGlobalState', () => {
  it.only('should create a store with async storage', async () => {
    asyncStorage.setItem('data', formatToStore(new Map([['prop', 0]])));

    const { promise, resolve } = createDecoupledPromise();

    setTimeout(async () => {
      const { promise: onStateChangedPromise, resolve: onStateChangedResolve } =
        createDecoupledPromise();

      const useData = createGlobalState(new Map(), {
        config: {
          asyncStorageKey: 'data',
        },
        onStateChanged: onStateChangedResolve,
      });

      let [data, setData, metadata] = useData();

      expect(!!metadata.isAsyncStorageReady).toBe(false);

      await onStateChangedPromise;

      [data, setData, metadata] = useData();

      expect(!!metadata.isAsyncStorageReady).toBe(true);
      expect(data).toEqual(new Map([['prop', 0]]));

      resolve();
    }, 0);

    return promise;
  });
});
