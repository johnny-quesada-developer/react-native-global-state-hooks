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

  let indexRef = 0;
  const mapRef = new Map();

  const mockUseRef = jest.fn((initialValue) => {
    indexRef += 1;

    const previous = mapRef.get(indexRef);
    if (previous) return previous;

    const value = {
      current: initialValue,
    };

    mapRef.set(indexRef, value);

    return value;
  });

  spyOn(React, "useEffect").and.callFake(mockMemo);

  spyOn(React, "useLayoutEffect").and.callFake(mockMemo);

  spyOn(React, "useMemo").and.callFake(mockMemo);

  spyOn(React, "useRef").and.callFake(mockUseRef);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  jest.clearAllTimers();
});

export {};
