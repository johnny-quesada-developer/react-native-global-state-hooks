import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getFakeAsyncStorage } from "./__test__/getFakeAsyncStorage";

const { fakeAsyncStorage: asyncStorage } = getFakeAsyncStorage();

beforeEach(() => {
  jest.spyOn(React, "useState").mockImplementation(((initialState) => {
    const value = typeof initialState === "function" ? initialState() : initialState;

    const setState = jest.fn(
      (() => {
        let state;

        return jest.fn((setter) => {
          const newState = typeof setter === "function" ? setter(state) : setter;

          state = newState;
        });
      })(),
    );

    return [value, setState];
  }) as any);

  jest.spyOn(AsyncStorage, "getItem").mockImplementation(asyncStorage.getItem);

  jest.spyOn(AsyncStorage, "setItem").mockImplementation(asyncStorage.setItem);

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

  jest.spyOn(React, "useEffect").mockImplementation(mockMemo);

  jest.spyOn(React, "useLayoutEffect").mockImplementation(mockMemo);

  jest.spyOn(React, "useMemo").mockImplementation(mockMemo);

  jest.spyOn(React, "useRef").mockImplementation(mockUseRef as any);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  jest.clearAllTimers();
});

export {};
