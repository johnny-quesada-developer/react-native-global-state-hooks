import { createDecoupledPromise } from 'cancelable-promise-jq';

import { GlobalStoreAsync, asyncStorage } from './GlobalStoreAsyc';

describe('GlobalStoreAsync Basics', () => {
  it('should create a store with async storage', async () => {
    asyncStorage.setItem('counter', 0);

    const { promise, resolve } = createDecoupledPromise();

    setTimeout(async () => {
      const { promise: onStateChangedPromise, resolve: onStateChangedResolve } =
        createDecoupledPromise();

      const storage = new GlobalStoreAsync(0, {
        asyncStorageKey: 'counter',
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

      expect(storage).toBeInstanceOf(GlobalStoreAsync);

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
