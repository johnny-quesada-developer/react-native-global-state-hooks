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
  const actionsConfig = {
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
  } as ActionCollectionConfig<number, null>;

  const countStore = new GlobalStore(countStoreInitialState, actionsConfig);

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
  it('should execute onInit callback', () => {
    expect.assertions(6);

    const initialState = { count: 0 };
    const onInitSpy = jest
      .fn()
      .mockImplementation(
        (parameters: StateConfigCallbackParam<number, null>) => {
          const { setState, getState, getMetadata, setMetadata, actions } =
            parameters;

          expect(getState()).toEqual(initialState);
          expect(getMetadata()).toBeNull();
          expect(setState).toBeInstanceOf(Function);
          expect(setMetadata).toBeInstanceOf(Function);
          expect(actions).toBe(null);
        }
      );

    new GlobalStore(initialState, null, {
      onInit: onInitSpy,
    });

    expect(onInitSpy).toBeCalledTimes(1);
  });

  it('should execute onInit callback with metadata', () => {
    expect.assertions(3);

    const initialState = { count: 0 };
    const onInitSpy = jest.fn().mockImplementation(
      (
        parameters: StateConfigCallbackParam<
          number,
          {
            isAsyncStorageReady: boolean;
          }
        >
      ) => {
        const { getMetadata, setMetadata } = parameters;

        expect(getMetadata()).toEqual({
          isAsyncStorageReady: false,
        });

        setMetadata({
          isAsyncStorageReady: true,
        });

        expect(getMetadata()).toEqual({
          isAsyncStorageReady: true,
        });
      }
    );

    new GlobalStore(initialState, null, {
      onInit: onInitSpy,
      metadata: {
        isAsyncStorageReady: false,
      },
    });

    expect(onInitSpy).toBeCalledTimes(1);
  });

  it('should execute onSubscribed callback every time a subscriber is added', () => {
    expect.assertions(8);

    let onSubscribedSpy = jest
      .fn()
      .mockImplementation(
        (parameters: StateConfigCallbackParam<number, null>) => {
          const { setState, getState, getMetadata, setMetadata, actions } =
            parameters;

          expect(getMetadata()).toBeNull();
          expect(setState).toBeInstanceOf(Function);
          expect(setMetadata).toBeInstanceOf(Function);
          expect(actions).toBe(null);
          expect(getState()).toEqual({ count: 0 });
        }
      );

    const store = new GlobalStore({ count: 0 }, null, {
      onSubscribed: onSubscribedSpy,
    });

    expect(onSubscribedSpy).toBeCalledTimes(0);

    const useStore = store.getHook();

    useStore();

    expect(onSubscribedSpy).toBeCalledTimes(1);

    onSubscribedSpy = jest.fn();

    store.config.onSubscribed = onSubscribedSpy;

    useStore();
    useStore();

    expect(onSubscribedSpy).toBeCalledTimes(2);
  });

  it('should execute onStateChanged callback every time the state is changed', () => {
    expect.assertions(7);

    const onStateChangedSpy = jest
      .fn()
      .mockImplementation(
        (parameters: StateConfigCallbackParam<number, null>) => {
          const { setState, getState, getMetadata, setMetadata, actions } =
            parameters;

          expect(getMetadata()).toBeNull();
          expect(setState).toBeInstanceOf(Function);
          expect(setMetadata).toBeInstanceOf(Function);
          expect(actions).toBe(null);
          expect(getState()).toEqual({ count: 1 });
        }
      );

    const store = new GlobalStore({ count: 0 }, null, {
      onStateChanged: onStateChangedSpy,
    });

    expect(onStateChangedSpy).toBeCalledTimes(0);

    const [, setState] = store.getHookDecoupled();

    setState((state) => ({ count: state.count + 1 }));

    expect(onStateChangedSpy).toBeCalledTimes(1);
  });

  it('should execute computePreventStateChange callback before state is changed and continue if it returns false', () => {
    expect.assertions(7);

    const computePreventStateChangeSpy = jest
      .fn()
      .mockImplementation(
        (parameters: StateConfigCallbackParam<number, null>) => {
          const { setState, getState, getMetadata, setMetadata, actions } =
            parameters;

          expect(getMetadata()).toBeNull();
          expect(setState).toBeInstanceOf(Function);
          expect(setMetadata).toBeInstanceOf(Function);
          expect(actions).toBe(null);

          return false;
        }
      );

    const store = new GlobalStore({ count: 0 }, null, {
      computePreventStateChange: computePreventStateChangeSpy,
    });

    expect(computePreventStateChangeSpy).toBeCalledTimes(0);

    const [getState, setState] = store.getHookDecoupled();

    setState((state) => ({ count: state.count + 1 }));

    expect(computePreventStateChangeSpy).toBeCalledTimes(1);
    expect(getState()).toEqual({ count: 1 });
  });

  it('should execute computePreventStateChange callback before state is changed and prevent state change if it returns true', () => {
    expect.assertions(7);

    const computePreventStateChangeSpy = jest
      .fn()
      .mockImplementation(
        (parameters: StateConfigCallbackParam<number, null>) => {
          const { setState, getState, getMetadata, setMetadata, actions } =
            parameters;

          expect(getMetadata()).toBeNull();
          expect(setState).toBeInstanceOf(Function);
          expect(setMetadata).toBeInstanceOf(Function);
          expect(actions).toBe(null);

          return true;
        }
      );

    const store = new GlobalStore({ count: 0 }, null, {
      computePreventStateChange: computePreventStateChangeSpy,
    });

    expect(computePreventStateChangeSpy).toBeCalledTimes(0);

    const [getState, setState] = store.getHookDecoupled();

    setState((state) => ({ count: state.count + 1 }));

    expect(computePreventStateChangeSpy).toBeCalledTimes(1);
    expect(getState()).toEqual({ count: 0 });
  });
});
