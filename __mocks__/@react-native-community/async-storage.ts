export const getItem = jest.fn(() => Promise.resolve(0));
export const setItem = jest.fn(() => Promise.resolve(0));

export default {
  getItem,
  setItem,
};
