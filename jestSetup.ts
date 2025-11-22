import AsyncStorage from "@react-native-async-storage/async-storage";

import { getFakeAsyncStorage } from "./__test__/getFakeAsyncStorage";

const { fakeAsyncStorage: asyncStorage } = getFakeAsyncStorage();

beforeEach(() => {
  jest.spyOn(AsyncStorage, "getItem").mockImplementation(asyncStorage.getItem);

  jest.spyOn(AsyncStorage, "setItem").mockImplementation(asyncStorage.setItem);

  jest.restoreAllMocks();
  jest.clearAllMocks();
  jest.clearAllTimers();
});

export {};
