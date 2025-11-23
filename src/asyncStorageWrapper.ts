/**
 * Async Storage Manager
 */
export type AsyncStorageManager = {
  /**
   * Get item from storage
   * @param key storage key
   * @returns stored value or null if not found
   */
  getItem: (key: string) => Promise<string | null>;

  /**
   * Set item in storage
   * @param key storage key
   * @param value value to store
   */
  setItem: (key: string, value: string) => Promise<void>;
};

/**
 * Wrapper to manage async storage manager
 * It tries to use @react-native-async-storage/async-storage by default
 * If not available, you can add your own async storage manager using the addAsyncStorageManager method
 */
const asyncStorageWrapper: AsyncStorageManager & {
  addAsyncStorageManager: (callback: () => Promise<AsyncStorageManager>) => Promise<void>;
} = (() => {
  let managerStatus: "pending" | "resolved" | "rejected" = "pending";
  let managerPromise: Promise<unknown>;
  let manager: null | AsyncStorageManager = null;

  // try to get default async storage manager
  (async () => {
    try {
      const promise = import("@react-native-async-storage/async-storage");
      managerPromise = promise;

      const { default: AsyncStorageManager } = await promise;
      const { getItem, setItem } = AsyncStorageManager;

      getItem.bind(AsyncStorageManager);
      setItem.bind(AsyncStorageManager);

      manager = {
        getItem,
        setItem,
      } as AsyncStorageManager;

      managerStatus = "resolved";
    } catch (err) {
      // if mode is development, log the error
      if (process.env.NODE_ENV === "development") {
        console.warn(err);
      }

      managerStatus = "rejected";
    } finally {
      managerPromise = null;
    }
  })();

  const throwNoAsyncStorageManagerError = () => {
    throw new Error(
      `[AsyncStorageManager Not Found] 

      Please install the react-native-async-storage/async-storage to be use as the default async storage manager or
      add an AsyncStorageManager using the asyncStorageWrapper.addAsyncStorageManager method before attempting to get or set items.`,
    );
  };

  const addAsyncStorageManager = async (callback: () => Promise<AsyncStorageManager>) => {
    try {
      if (managerStatus === "pending" && managerPromise) {
        await managerPromise.catch(() => {});
      }

      managerStatus = "pending";

      const promise = callback();
      managerPromise = promise;

      manager = await promise;
      managerStatus = "resolved";
    } catch (error) {
      managerPromise = null;
      managerStatus = "rejected";

      throw error;
    }
  };

  const waitUntilReady = async () => {
    if (managerStatus === "pending" && managerPromise) return managerPromise;
    if (managerStatus === "rejected")
      return managerPromise.catch((err) => {
        throw err;
      });
    if (!manager) throwNoAsyncStorageManagerError();

    return manager;
  };

  const getItem = async (key: string): Promise<string | null> => {
    await waitUntilReady();

    return manager.getItem(key);
  };

  const setItem = async (key: string, value: string) => {
    await waitUntilReady();

    return manager.setItem(key, value);
  };

  return {
    getItem,
    setItem,
    addAsyncStorageManager,
  };
})();

export default asyncStorageWrapper;
