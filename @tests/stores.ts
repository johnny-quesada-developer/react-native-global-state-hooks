import * as IGlobalState from '../src/GlobalStoreTypes';
import GlobalStore from '../src/GlobalStore';
import { IActionCollectionConfig } from '../src/GlobalStoreTypes';

const decreaseAction = (decrease: number) => async (setter: IGlobalState.StateSetter<number>, state: number) => {
  setter(state - decrease);
};

// is so easy to reuse functionality by just extending actions
const countActions: IActionCollectionConfig<number> = {
  decrease: decreaseAction,
  increase: (increase: number) => async (setter: IGlobalState.StateSetter<number>, state: number) => {
    setter(state + increase);
  },
};

// simple store
export const countStore = new GlobalStore(0);

// simple percist store
export const countPercistStore = new GlobalStore<number, string>(0, null, 'countPercistStore');

// store with actions
export const countStoreWithActions = new GlobalStore(0, countActions);

export const countStoreWithActionsTyped = new GlobalStore(0, countActions);

export const countStoreWithActionsPersist = new GlobalStore(
  0,
  countActions,
  'countStoreWithActionsPersist',
);
