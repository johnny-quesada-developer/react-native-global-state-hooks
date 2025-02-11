export const getFakeAsyncStorage = () => {
  const dictionary = new Map<string, string>();

  const fakeAsyncStorage = {
    getItem: jest.fn().mockImplementation((key): Promise<string | null> => {
      return new Promise<string | null>((resolve) => {
        setTimeout(() => {
          const value = dictionary.get(key) ?? null;

          resolve(value);
        }, 0);
      });
    }),
    setItem: jest.fn().mockImplementation(async (key, value): Promise<void> => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const jsonValue = JSON.stringify(value);

          dictionary.set(key, jsonValue);
          resolve();
        }, 0);
      });
    }),
  };

  return { fakeAsyncStorage, dictionary };
};
