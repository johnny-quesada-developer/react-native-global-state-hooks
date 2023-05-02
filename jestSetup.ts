import React from "react";

beforeEach(() => {
  spyOn(React, "useState").and.callFake(((initialState) => {
    const value =
      typeof initialState === "function" ? initialState() : initialState;

    const setState = jest.fn(
      (() => {
        let state;

        return jest.fn((setter) => {
          const newState =
            typeof setter === "function" ? setter(state) : setter;

          state = newState;
        });
      })()
    );

    return [value, setState];
  }) as any);

  let index = 0;
  const map = new Map();

  const mockMemo = jest.fn((callback) => {
    index += 1;

    const previous = map.get(index);
    if (previous) return previous;

    const value = callback();

    map.set(index, value);

    return value;
  });

  spyOn(React, "useEffect").and.callFake(mockMemo);

  spyOn(React, "useLayoutEffect").and.callFake(mockMemo);

  spyOn(React, "useMemo").and.callFake(mockMemo);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  jest.clearAllTimers();
});

export {};
