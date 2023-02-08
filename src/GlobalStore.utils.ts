export const debounce = <T extends Function>(callback: T, wait = 300): T => {
  let timer: NodeJS.Timeout;

  return ((...args: unknown[]) => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      callback(...args);
    }, wait);
  }) as unknown as T;
};
