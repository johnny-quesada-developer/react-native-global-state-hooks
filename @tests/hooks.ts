import { ICountActions } from './fixtures';
import {
  countPercistStore,
  countStore, countStoreWithActions,
  countStoreWithActionsPersist, countStoreWithActionsTyped,
} from './stores';

export const useCountStore = countStore.getHook();

export const useCountPercist = countPercistStore.getHook();

export const useCountWithActions = countStoreWithActions.getHook();

export const useCountWithActionsTyped = countStoreWithActionsTyped.getHook<ICountActions>();

export const useCountWithActionsP = countStoreWithActionsPersist.getHook<ICountActions>();
