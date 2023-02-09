import { GlobalStore } from '../../src/GlobalStore';
import {
  ActionCollectionConfig,
  ActionCollectionResult,
  ActionConfigCallbackParam,
  StateSetter,
} from '../../src/GlobalStore.types';

import { useState, useEffect } from 'react';

const countStoreInitialState = 1;
const createCountStoreWithActions = (spy?: jest.Mock) => {
  const countStore = new GlobalStore(
    countStoreInitialState,
    {
      increase:
        (n: number) =>
        ({ setState }: ActionConfigCallbackParam<number>) => {
          setState((state) => state + 1);
        },
    },
    {}
  );

  return countStore as typeof countStore & {
    state: number;
    storeActionsConfig: Record<
      string,
      () => (setter: StateSetter<number>) => unknown
    >;
    getStoreActionsMap: (param: {
      invokerSetState?: React.Dispatch<React.SetStateAction<number>>;
    }) => ActionCollectionResult<
      number,
      null,
      ActionCollectionConfig<number, null>
    >;
  };
};

describe('Basic GlobalStore', () => {
  it('should be able to create a new instance with state', () => {
    const stateValue = 'test';
    const store = new GlobalStore(stateValue);

    expect(store).toBeInstanceOf(GlobalStore);
    expect((store as unknown as { state: unknown }).state).toBe(stateValue);
  });

  it('state setter should be a function', () => {
    const stateValue = 'test';
    const store = new GlobalStore(stateValue);

    const [, setState] = store.getHookDecoupled();

    expect(setState).toBeInstanceOf(Function);
  });

  it('should be able to get the state', () => {
    const stateValue = 'test';
    const store = new GlobalStore(stateValue);

    const [getState] = store.getHookDecoupled();

    expect(getState()).toBe(stateValue);
  });

  it('should be able to set the state', () => {
    const stateValue = 'test';
    const store = new GlobalStore(stateValue);

    const [, setState] = store.getHookDecoupled();

    setState('test2');

    expect((store as unknown as { state: unknown }).state).toBe('test2');
  });

  it('should notifiy initialize all subscribers of the store', () => {
    const stateValue = 'test';
    const stateValue2 = 'test2';

    const store = new GlobalStore(stateValue);

    const useHook = store.getHook();
    const [getState, setState] = store.getHookDecoupled();

    useHook();
    useHook();

    const [setter1, setter2] = store.subscribers;

    setState(stateValue2);

    expect(getState()).toBe(stateValue2);
    expect(useState).toHaveBeenCalledTimes(2);
    expect(useEffect).toHaveBeenCalledTimes(2);

    expect(setter1).toBeCalledTimes(1);
    expect(setter2).toBeCalledTimes(1);
  });
});

describe('GlobalStore with actions', () => {
  it('should be able to create a new instance with state and actions, setter should be and object', () => {
    const store = createCountStoreWithActions();

    expect(store).toBeInstanceOf(GlobalStore);
    expect(store.state).toBe(countStoreInitialState);
    expect(store.storeActionsConfig).toBeDefined();

    const actions = store.getStoreActionsMap({});

    expect(actions).not.toBeInstanceOf(Function);
    expect(actions.increase).toBeDefined();
  });

  it('should be able to get the state', () => {
    const store = createCountStoreWithActions();

    const [getState] = store.getHookDecoupled();

    expect(getState()).toBe(countStoreInitialState);
  });

  it('should be able to set the state', () => {
    const store = createCountStoreWithActions();

    const [getState, actions] = store.getHookDecoupled();

    const test = actions.increase(1);

    expect(getState()).toBe(2);
  });

  it('should initialize all subscribers of the store', () => {
    const store = createCountStoreWithActions();

    const useHook = store.getHook();
    const [getState] = store.getHookDecoupled();

    useHook();
    useHook();

    const [setter1, setter2] = store.subscribers;

    expect(getState()).toBe(countStoreInitialState);
    expect(useState).toHaveBeenCalledTimes(2);
    expect(useEffect).toHaveBeenCalledTimes(2);

    expect(setter1).toBeCalledTimes(0);
    expect(setter2).toBeCalledTimes(0);
  });

  it('should update all subscribers of the store', () => {
    const store = createCountStoreWithActions();

    const useHook = store.getHook();
    const [getState, actions] = store.getHookDecoupled();

    useHook();
    useHook();

    const [setter1, setter2] = store.subscribers;

    actions.increase(1);

    expect(getState()).toBe(2);
    expect(useState).toHaveBeenCalledTimes(2);
    expect(useEffect).toHaveBeenCalledTimes(2);

    expect(setter1).toBeCalledTimes(1);
    expect(setter2).toBeCalledTimes(1);
  });
});
