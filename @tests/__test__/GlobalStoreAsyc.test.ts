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
import { getFakeAsyncStorage } from './getFakeAsyncStorage';
import { GlobalStoreAsync } from './GlobalStoreAsyc';

describe('GlobalStoreAsync Basics', () => {
  it.skip('should create a store with async storage', async () => {
    const metadata = {
      // determine if the async storage it already loaded
      isAsyncStorageReady: false,
    };

    const { promise: onInitPromise, resolve: onInitResolve } =
      createDecoupledPromise();

    const storage = new GlobalStoreAsync(0, metadata, null, {
      asyncStorageKey: 'counter',
    });

    jest.spyOn(storage as any, 'onInit').mockImplementation(async () => {
      onInitResolve();
    });

    expect(storage).toBeInstanceOf(GlobalStoreAsync);
    expect((storage as any).isAsyncStorageReady).toBe(false);

    await onInitPromise;

    expect((storage as any).isAsyncStorageReady).toBe(true);
  });
});
