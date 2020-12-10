import * as IGlobalState from '../src/GlobalStoreTypes';
import GlobalStore from '../src/GlobalStore';

const decreaseAction = (decrease: number) => async (setter: IGlobalState.StateSetter<number>, state: number) => {
  setter(state - decrease);
};

interface ICountActions extends IGlobalState.ActionCollectionResult<IGlobalState.IActionCollection<number>> {
  decrease: (decrease: number) => (setter: IGlobalState.StateSetter<number>, state: number) => Promise<void>,
  increase: (increase: number) => (setter: IGlobalState.StateSetter<number>, state: number) => Promise<void>,
}

// is so easy to reuse functionality by just extending actions
const CountActions = {
  decrease: decreaseAction,
  increase: (increase: number) => async (setter: IGlobalState.StateSetter<number>, state: number) => {
    setter(state + increase);
  },
};

// simple store
const countStore = new GlobalStore(0);

export const useCountStore = countStore.getHook();
export const useCountStoreDecoupled = countStore.getHookDecoupled();

// simple percist store
const countPercistStore = new GlobalStore<number, string>(0, null, 'countPercistStore');

export const useCountPercist = countPercistStore.getHook();
export const useCountPercistDecoupled = countPercistStore.getHookDecoupled();

// store with actions
const countStoreWithActions = new GlobalStore(0, CountActions);

export const useCountWithActions = countStoreWithActions.getHook();
export const useCountWithActionsDecoupled = countStoreWithActions.getHookDecoupled();

const countStoreWithActionsTyped = new GlobalStore(0, CountActions as ICountActions);

export const useCountWithActionsTyped = countStoreWithActionsTyped.getHook<ICountActions>();
export const useCountWithActionsTypedDecoupled = countStoreWithActionsTyped.getHookDecoupled<ICountActions>();

const countStoreWithActionsPersist = new GlobalStore(
  0,
  CountActions,
  'countStoreWithActionsPersist',
);

export const useCountWithActionsP = countStoreWithActionsPersist.getHook<ICountActions>();
export const useCountWithActionsDecoupledP = countStoreWithActionsPersist.getHookDecoupled<ICountActions>();
