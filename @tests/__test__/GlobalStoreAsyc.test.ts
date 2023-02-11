import { GlobalStore } from '../../src/GlobalStore';
import {
  CancelablePromise,
  createDecoupledPromise,
} from 'cancelable-promise-jq';

import {
  ActionCollectionConfig,
  ActionCollectionResult,
  GlobalStoreConfig,
  StoreTools,
} from '../../src/GlobalStore.types';

import { useState, useEffect } from 'react';
import { formatFromStore, formatToStore } from 'json-storage-formatter';
import { GlobalStoreAsync, asyncStorage } from './GlobalStoreAsyc';

describe('GlobalStoreAsync Basics', () => {
  it('should create a store with async storage', async () => {
    const metadata = {
      // determine if the async storage it already loaded
      isAsyncStorageReady: false,
    };

    asyncStorage.setItem('counter', 0);

    const { promise, resolve } = createDecoupledPromise();

    setTimeout(async () => {
      const { promise: onStateChangedPromise, resolve: onStateChangedResolve } =
        createDecoupledPromise();

      const storage = new GlobalStoreAsync(0, metadata, null, {
        asyncStorageKey: 'counter',
      });

      const onStateChanged = (storage as any).onStateChanged;
      onStateChanged.bind(storage);

      jest
        .spyOn(storage, 'onStateChanged' as any)
        .mockImplementation((...parameters) => {
          onStateChanged(...parameters);

          onStateChangedResolve();
        });

      expect(storage).toBeInstanceOf(GlobalStoreAsync);
      expect((storage as any).isAsyncStorageReady).toBe(false);

      const [getState] = storage.getHookDecoupled();

      // add a subscriber to the store
      storage.getHook()();

      const [setter] = storage.subscribers;
      const setState = jest.fn(setter);

      storage.subscribers = new Set([setState]);

      await onStateChangedPromise;

      expect((storage as any).isAsyncStorageReady).toBe(true);
      expect(setState).toBeCalledTimes(1);

      expect(getState()).toBe(0);

      const storedValue = await asyncStorage.getItem('counter');

      expect(storedValue).toBe('"0"');

      resolve();
    }, 0);

    return promise;
  });
});
