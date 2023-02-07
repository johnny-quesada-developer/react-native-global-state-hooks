import { GlobalStore } from '../../src/GlobalStore';
import { StateSetter } from '../../src/GlobalStoreTypes';
import { useState, useEffect } from 'react';

// import { useCountHooks } from '../fixtures';

describe('GlobalStore', () => {
  it('should be able to create a new instance', () => {
    const store = new GlobalStore({});

    expect(store).toBeInstanceOf(GlobalStore);
  });

  it('should be able to create a new instance with a state', () => {
    const store = new GlobalStore({ test: 'test' });

    expect(store).toBeInstanceOf(GlobalStore);
  });

  it('should be able to create a new instance with a state and actions', () => {
    const countStore = new GlobalStore<number, null, any>(1, {
      increase: () => (setter: StateSetter<number>) => {
        setter((state) => state + 1);
      },
    });

    expect(countStore).toBeInstanceOf(GlobalStore);
    const [_, actions] = countStore.getHookDecoupled<any>();

    expect(actions).toHaveProperty('increase');
  });
});
