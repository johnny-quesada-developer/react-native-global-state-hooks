import { GlobalStore } from '../../src/GlobalStore';

import {
  ActionCollectionConfig,
  ActionCollectionResult,
  StateConfigCallbackParam,
  StateSetter,
} from '../../src/GlobalStore.types';

import { useState, useEffect } from 'react';

const countStoreInitialState = 1;
const createCountStoreWithActions = (spy?: jest.Mock) => {
  const countStore = new GlobalStore(
    countStoreInitialState,
    {
      log(message: string) {
        return () => spy?.(message);
      },
      increase(increase: number = 1) {
        this.log('wrapper');

        return ({ setState, getState }) => {
          setState((state) => state + increase);

          this.log('execution');

          return getState();
        };
      },
    } as ActionCollectionConfig<number, null>,
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
    const stateValue = 1;
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

    actions.increase();

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

    actions.increase();

    expect(getState()).toBe(2);
    expect(useState).toHaveBeenCalledTimes(2);
    expect(useEffect).toHaveBeenCalledTimes(2);

    expect(setter1).toBeCalledTimes(1);
    expect(setter2).toBeCalledTimes(1);
  });

  it('actions should be able to call other actions', () => {
    const spy = jest.fn(() => 1);
    const store = createCountStoreWithActions(spy);

    const [, actions] = store.getHookDecoupled();

    const result = actions.increase(1);

    expect(spy).toBeCalledTimes(2);

    expect(spy).toBeCalledWith('wrapper');
    expect(spy).toBeCalledWith('execution');

    expect(result).toBe(2);
  });
});

describe('GlobalStore with configuration callbacks', () => {
  it('should execute onInit callback without actions', () => {
    expect.assertions(8);

    let params!: StateConfigCallbackParam<number, null>;

    const spy = jest.fn().mockImplementation((_parameters) => {
      params = _parameters;

      const { setState, getState, getMetadata, setMetadata, actions } = params;

      expect(getState()).toEqual(initialState);
      expect(getMetadata()).toBeNull();
      expect(setState).toBeInstanceOf(Function);
      expect(setMetadata).toBeInstanceOf(Function);
      expect(actions).toBe(null);
    });

    const initialState = { count: 0 };
    new GlobalStore(initialState, null, {
      onInit: spy,
    });

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(params);
    expect(params).toBeDefined();
  });

  it('should execute onInit callback', () => {
    expect.assertions(8);

    let params!: StateConfigCallbackParam<number, null>;

    const spy = jest.fn().mockImplementation((_parameters) => {
      params = _parameters;

      const { setState, getState, getMetadata, setMetadata, actions } = params;

      expect(getState()).toEqual(initialState);
      expect(getMetadata()).toBeNull();
      expect(setState).toBeInstanceOf(Function);
      expect(setMetadata).toBeInstanceOf(Function);
      expect(actions).toBe(null);
    });

    const initialState = { count: 0 };
    new GlobalStore(initialState, null, {
      onInit: spy,
    });

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(params);
    expect(params).toBeDefined();
  });
});
