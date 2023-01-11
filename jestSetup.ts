/* eslint-disable max-nested-callbacks */
/* eslint-disable camelcase */
import * as Stage3All from './@tests/Stage3';
import * as Stage2All from './@tests/Stage2';
import * as Stage1All from './@tests/Stage1';

beforeEach(() => {
  jest.spyOn(Stage1All, 'default');
  jest.spyOn(Stage2All, 'default');
  jest.spyOn(Stage3All, 'default');
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

export {};
