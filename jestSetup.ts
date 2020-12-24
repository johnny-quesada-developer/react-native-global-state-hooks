/* eslint-disable max-nested-callbacks */
/* eslint-disable camelcase */
import { debounce } from 'lodash';
import renderer from 'react-test-renderer';
import ReactDom from 'react-dom';
import GlobalStore from './src/GlobalStore';
import * as Stage3All from './@tests/Stage3';
import * as Stage2All from './@tests/Stage2';
import * as Stage1All from './@tests/Stage1';

beforeEach(() => {
  jest.spyOn(Stage1All, 'default');
  jest.spyOn(Stage2All, 'default');
  jest.spyOn(Stage3All, 'default');

  const ExecutePendingBatches = debounce(() => {
    const GlobalStoreAny: any = GlobalStore;

    renderer.act(() => ReactDom.unstable_batchedUpdates(() => {
      GlobalStoreAny.batchedUpdates.forEach(([execute]: [() => void]) => {
        execute();
      });
      GlobalStoreAny.batchedUpdates = [];
      GlobalStore.ExecutePendingBatchesCallbacks.forEach((callback) => callback());
      GlobalStore.ExecutePendingBatchesCallbacks = [];
    }));
  }, 0);

  jest.spyOn(GlobalStore, 'ExecutePendingBatches').mockImplementation(ExecutePendingBatches);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

export {};
