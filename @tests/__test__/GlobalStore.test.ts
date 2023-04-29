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

const countStoreInitialState = 1;
const createCountStoreWithActions = (spy?: jest.Mock) => {
  const countStore = new GlobalStore(countStoreInitialState, null, {
    log(message: string) {
      return (): void => spy?.(message);
    },

    increase(increase: number = 1) {
      return ({ setState, getState }: StoreTools<number>) => {
        setState((state) => state + increase);

        // this also work, the only trouble is that typescript will not recognize the action types
        // and log will be an "any" type
        this.log('increase');

        return getState();
      };
    },

    decrease(decrease: number = 1) {
      return ({ setState, getState }: StoreTools<number>) => {
        setState((state) => state - decrease);

        this.log('decrease');

        return getState();
      };
    },
  } as const);

  return countStore as typeof countStore &
    ({
      stateWrapper: {
        state: number;
      };
      setterConfig: ActionCollectionConfig<number, unknown>;
      getMetadataClone: () => null;
      getStateClone: () => number;
      getStoreActionsMap: (param: {
        invokerSetState?: React.Dispatch<React.SetStateAction<number>>;
      }) => ActionCollectionResult<
        number,
        null,
        ActionCollectionConfig<number, null>
      >;
    } & GlobalStoreConfig<number, null, ActionCollectionConfig<number, null>>);
};

describe('GlobalStore Basic', () => {
  it('should be able to create a new instance with state', () => {
    const stateValue = 'test';
    const store = new GlobalStore(stateValue);

    expect(store).toBeInstanceOf(GlobalStore);
    expect(
      (store as unknown as { stateWrapper: { state: unknown } }).stateWrapper
        .state
    ).toBe(stateValue);
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

    expect(
      (store as unknown as { stateWrapper: { state: unknown } }).stateWrapper
        .state
    ).toBe('test2');
  });

  it('should be able to set the state with a function', () => {
    const stateValue = 'test';
    const store = new GlobalStore(stateValue);

    const [, setState] = store.getHookDecoupled();

    setState((state) => `${state}2`);

    expect(
      (store as unknown as { stateWrapper: { state: unknown } }).stateWrapper
        .state
    ).toBe('test2');
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
    expect(store.stateWrapper.state).toBe(countStoreInitialState);
    expect(store.setterConfig).toBeDefined();

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
});

describe('GlobalStore with configuration callbacks', () => {
  it('should execute onInit callback', () => {
    expect.assertions(6);

    const initialState = { count: 0 };
    const onInitSpy = jest.fn();

    new GlobalStore(initialState, {
      onInit: (parameters) => {
        onInitSpy();

        const { setState, getState, getMetadata, setMetadata, actions } =
          parameters;

        expect(getState()).toEqual(initialState);
        expect(getMetadata()).toBeNull();
        expect(setState).toBeInstanceOf(Function);
        expect(setMetadata).toBeInstanceOf(Function);
        expect(actions).toBe(null);
      },
    });

    expect(onInitSpy).toBeCalledTimes(1);
  });

  it('should execute onInit callback with metadata', () => {
    expect.assertions(3);

    const initialState = { count: 0 };
    const onInitSpy = jest.fn();

    new GlobalStore(initialState, {
      metadata: {
        isAsyncStorageReady: false,
      },
      onInit: (parameters) => {
        onInitSpy();

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
      },
    });

    expect(onInitSpy).toBeCalledTimes(1);
  });

  it('should execute onSubscribed callback every time a subscriber is added', () => {
    expect.assertions(18);

    let onSubscribedSpy = jest.fn();

    const store = new GlobalStore(
      { count: 0 },
      {
        onSubscribed: (parameters) => {
          onSubscribedSpy();

          const { setState, getState, getMetadata, setMetadata, actions } =
            parameters;

          // this code will be execute 3 times
          expect(getMetadata()).toBeNull();
          expect(setState).toBeInstanceOf(Function);
          expect(setMetadata).toBeInstanceOf(Function);
          expect(actions).toBe(null);
          expect(getState()).toEqual({ count: 0 });
        },
      }
    );

    expect(onSubscribedSpy).toBeCalledTimes(0);

    const useStore = store.getHook();

    useStore();

    expect(onSubscribedSpy).toBeCalledTimes(1);

    useStore();
    useStore();

    expect(onSubscribedSpy).toBeCalledTimes(3);
  });

  it('should execute onStateChanged callback every time the state is changed', () => {
    expect.assertions(7);

    const onStateChangedSpy = jest.fn();

    const store = new GlobalStore(
      { count: 0 },
      {
        onStateChanged: (parameters) => {
          onStateChangedSpy();

          const { setState, getState, getMetadata, setMetadata, actions } =
            parameters;

          expect(getMetadata()).toBeNull();
          expect(setState).toBeInstanceOf(Function);
          expect(setMetadata).toBeInstanceOf(Function);
          expect(actions).toBe(null);
          expect(getState()).toEqual({ count: 1 });
        },
      }
    );

    expect(onStateChangedSpy).toBeCalledTimes(0);

    const [, setState] = store.getHookDecoupled();

    setState((state) => ({ count: state.count + 1 }));

    expect(onStateChangedSpy).toBeCalledTimes(1);
  });

  it('should execute computePreventStateChange callback before state is changed and continue if it returns false', () => {
    expect.assertions(7);

    const computePreventStateChangeSpy = jest.fn();

    const store = new GlobalStore(
      { count: 0 },
      {
        computePreventStateChange: (parameters) => {
          computePreventStateChangeSpy();

          const { setState, getState, getMetadata, setMetadata, actions } =
            parameters;

          expect(getMetadata()).toBeNull();
          expect(setState).toBeInstanceOf(Function);
          expect(setMetadata).toBeInstanceOf(Function);
          expect(actions).toBe(null);

          return false;
        },
      }
    );

    expect(computePreventStateChangeSpy).toBeCalledTimes(0);

    const [getState, setState] = store.getHookDecoupled();

    setState((state) => ({ count: state.count + 1 }));

    expect(computePreventStateChangeSpy).toBeCalledTimes(1);
    expect(getState()).toEqual({ count: 1 });
  });

  it('should execute computePreventStateChange callback before state is changed and prevent state change if it returns true', () => {
    expect.assertions(7);

    const computePreventStateChangeSpy = jest.fn();

    const store = new GlobalStore(
      { count: 0 },
      {
        computePreventStateChange: (parameters) => {
          computePreventStateChangeSpy();

          const { setState, getMetadata, setMetadata, actions } = parameters;

          expect(getMetadata()).toBeNull();
          expect(setState).toBeInstanceOf(Function);
          expect(setMetadata).toBeInstanceOf(Function);
          expect(actions).toBe(null);

          return true;
        },
      }
    );

    expect(computePreventStateChangeSpy).toBeCalledTimes(0);

    const [getState, setState] = store.getHookDecoupled();

    setState((state) => ({ count: state.count + 1 }));

    expect(computePreventStateChangeSpy).toBeCalledTimes(1);
    expect(getState()).toEqual({ count: 0 });
  });
});

describe('Custome store by using config parameter', () => {
  const getInitialState = () => {
    return new Map([
      [1, { name: 'john' }],
      [2, { name: 'doe' }],
    ]);
  };

  it('should initialize the store with the initial state where there is no async storage data', async () => {
    expect.assertions(6);

    const initialState = getInitialState();
    const { fakeAsyncStorage } = getFakeAsyncStorage();

    const onStateChangedSpy = jest.fn();
    const onInitSpy = jest.fn();

    const { promise: mainPromise, ...tools } = createDecoupledPromise();

    let store: GlobalStore<any, any, any>;

    let getMetadataClone!: () => {
      isAsyncStorageReady: boolean;
    };

    setTimeout(async () => {
      await new CancelablePromise<void>((resolve) => {
        store = new GlobalStore(initialState, {
          metadata: {
            isAsyncStorageReady: false as boolean,
          },
          onInit: async (parameters) => {
            getMetadataClone = parameters.getMetadata;

            onInitSpy();

            const { setMetadata, setState } = parameters;

            const stored = (await fakeAsyncStorage.getItem('items')) ?? null;

            setMetadata({
              isAsyncStorageReady: true,
            });

            if (!stored) {
              resolve();

              return;
            }

            const items = formatFromStore(JSON.parse(stored)) as Map<
              number,
              { name: string }
            >;

            setState(items);
            resolve();
          },
          onStateChanged: ({ getState }) => {
            onStateChangedSpy();

            const newState = getState();

            fakeAsyncStorage.setItem('items', formatToStore(newState));
          },
        });

        expect(getMetadataClone()).toEqual({
          isAsyncStorageReady: false,
        });
      });

      const [getState] = store.getHookDecoupled();

      expect(onInitSpy).toBeCalledTimes(1);
      expect(onStateChangedSpy).toBeCalledTimes(0);
      expect(fakeAsyncStorage.getItem).toBeCalledTimes(1);
      expect(getState()).toEqual(initialState);
      expect(getMetadataClone()).toEqual({ isAsyncStorageReady: true });

      tools.resolve();
    }, 0);

    return mainPromise;
  });

  it('should initialize the store with the async storage data where there is async storage data', async () => {
    expect.assertions(6);

    const initialState = getInitialState();
    const { fakeAsyncStorage } = getFakeAsyncStorage();
    const onStateChangedSpy = jest.fn();
    const onInitSpy = jest.fn();

    const { promise: mainPromise, ...tools } = createDecoupledPromise();

    const storedMap = new Map(initialState);
    storedMap.set(3, { name: 'jane' });

    fakeAsyncStorage.setItem('items', formatToStore(storedMap));

    setTimeout(async () => {
      let store!: GlobalStore<any, any, any>;

      let getMetadataClone!: () => {
        isAsyncStorageReady: boolean;
      };

      await new CancelablePromise<void>((resolve) => {
        store = new GlobalStore(initialState, {
          metadata: {
            isAsyncStorageReady: false,
          },
          onInit: async (parameters) => {
            getMetadataClone = parameters.getMetadata;

            onInitSpy();

            const { setMetadata, setState } = parameters;

            const stored = (await fakeAsyncStorage.getItem('items')) ?? null;

            setMetadata({
              // @ts-ignore
              isAsyncStorageReady: true,
            });

            if (!stored) {
              resolve();

              return;
            }

            const items = formatFromStore(JSON.parse(stored)) as Map<
              number,
              { name: string }
            >;

            setState(items);
            resolve();
          },
          onStateChanged: ({ getState }) => {
            onStateChangedSpy();

            const newState = getState();

            fakeAsyncStorage.setItem('items', formatToStore(newState));
          },
        });

        expect(getMetadataClone()).toEqual({
          isAsyncStorageReady: false,
        });
      });

      const [getState] = store.getHookDecoupled();

      expect(onInitSpy).toBeCalledTimes(1);
      expect(onStateChangedSpy).toBeCalledTimes(1);
      expect(fakeAsyncStorage.getItem).toBeCalledTimes(1);

      expect(getState()).toEqual(storedMap);
      expect(getMetadataClone()).toEqual({ isAsyncStorageReady: true });

      tools.resolve();
    }, 0);

    return mainPromise;
  });

  it('should be able to update the store async storage', async () => {
    expect.assertions(6);

    const initialState = getInitialState();
    const { fakeAsyncStorage } = getFakeAsyncStorage();

    const { promise: mainPromise, ...tools } = createDecoupledPromise();
    const { promise: onStateChangedPomise, ...toolsOnStateChangedPromise } =
      createDecoupledPromise();

    setTimeout(async () => {
      let store!: GlobalStore<any, any>;

      let getMetadataClone!: () => {
        isAsyncStorageReady: boolean;
      };

      await new CancelablePromise<void>((resolve) => {
        store = new GlobalStore(initialState, {
          metadata: {
            isAsyncStorageReady: false,
          },
          onInit: async (parameters) => {
            getMetadataClone = parameters.getMetadata;

            const { setMetadata, setState } = parameters;
            const stored = (await fakeAsyncStorage.getItem('items')) ?? null;

            setMetadata({
              isAsyncStorageReady: true as false,
            });

            if (!stored) {
              resolve();

              return;
            }

            const items = formatFromStore(JSON.parse(stored)) as Map<
              number,
              { name: string }
            >;

            setState(items);
            resolve();
          },
          onStateChanged: async ({ getState }) => {
            const newState = getState();

            await fakeAsyncStorage.setItem('items', formatToStore(newState));

            toolsOnStateChangedPromise.resolve();
          },
        });

        expect(getMetadataClone()).toEqual({
          isAsyncStorageReady: false,
        });
      });

      const [getState] = store.getHookDecoupled();
      const [, setState] = store.getHook()();

      const newState = new Map(getState());
      newState.set(3, { name: 'jane' });

      setState(newState);

      expect(fakeAsyncStorage.getItem).toBeCalledTimes(1);
      expect(getState()).toEqual(newState);
      expect(getMetadataClone()).toEqual({ isAsyncStorageReady: true });

      await onStateChangedPomise;

      const stored = await fakeAsyncStorage.getItem('items');

      expect(stored).toEqual(
        '{"$t":"map","$v":[[1,{"name":"john"}],[2,{"name":"doe"}],[3,{"name":"jane"}]]}'
      );

      // should have been called once to update the state based on the async storage data
      expect(useState).toBeCalledTimes(1);

      tools.resolve();
    }, 0);

    return mainPromise;
  });
});

describe('GlobalStore Accessing custom actions from other actions', () => {
  it('should be able to access custom actions from other actions', () => {
    expect.assertions(8);

    const logSpy = jest.fn();

    const store = createCountStoreWithActions(logSpy);

    const [getState, actions] = store.getHookDecoupled();

    expect(getState()).toEqual(1);
    expect(logSpy).toBeCalledTimes(0);

    actions.increase();

    expect(getState()).toEqual(2);
    expect(logSpy).toBeCalledTimes(1);
    expect(logSpy).toBeCalledWith('increase');

    actions.decrease();

    expect(getState()).toEqual(1);
    expect(logSpy).toBeCalledTimes(2);
    expect(logSpy).toBeCalledWith('decrease');
  });
});
