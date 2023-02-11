import React from 'react';

beforeEach(() => {
  spyOn(React, 'useState').and.callFake(((initialState) => {
    const value =
      typeof initialState === 'function' ? initialState() : initialState;

    const setState = jest.fn(
      (() => {
        let state;

        return jest.fn((setter) => {
          const newState =
            typeof setter === 'function' ? setter(state) : setter;

          state = newState;
        });
      })()
    );

    return [value, setState];
  }) as any);

  const mockUseEffect = jest.fn((callback) => {
    const value = callback();

    return value;
  });

  spyOn(React, 'useEffect').and.callFake(mockUseEffect);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  jest.clearAllTimers();
});

export {};
