import { getFakeAsyncStorage } from "./__test__/getFakeAsyncStorage";

const { fakeAsyncStorage: asyncStorage } = getFakeAsyncStorage();

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const AsyncStorage = jest.requireMock("@react-native-async-storage/async-storage").default;

beforeEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();

  AsyncStorage.getItem.mockImplementation(asyncStorage.getItem);
  AsyncStorage.setItem.mockImplementation(asyncStorage.setItem);
});

export {};
