import { ICountActions } from './fixtures';
import {
  countPercistStore, countStore, countStoreWithActions,
  countStoreWithActionsPersist, countStoreWithActionsTyped,
} from './stores';

export const countStoreDecoupled = countStore.getHookDecoupled();

export const countPercistDecoupled = countPercistStore.getHookDecoupled();

export const countWithActionsDecoupled = countStoreWithActions.getHookDecoupled();

export const countWithActionsTypedDecoupled = countStoreWithActionsTyped.getHookDecoupled<ICountActions>();

export const countStoreWithActionsPersistDecoupled = countStoreWithActionsPersist.getHookDecoupled<ICountActions>();

export const countWithActionsDecoupledPersisted = countStoreWithActionsPersist.getHookDecoupled<ICountActions>();
