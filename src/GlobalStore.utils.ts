import { formatToStore, formatFromStore, clone } from 'json-storage-formatter';

//* Exporting the formatter functions
export { formatToStore, formatFromStore, clone };

/**
 * Debounce function to prevent multiple calls to the same function in a short period of time
 * @param callback Function to be called
 * @param wait Time to wait before calling the function
 * @returns Function to be called
 */
export const debounce = <T extends Function>(callback: T, wait = 300): T => {
  let timer: NodeJS.Timeout;

  return ((...args: unknown[]) => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      callback(...args);
    }, wait);
  }) as unknown as T;
};
