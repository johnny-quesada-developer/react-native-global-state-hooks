import React from "react";


beforeEach(() => {
  // mock useState
  // @ts-ignore
  jest.spyOn(React, "useState").mockImplementation((initialState) => {
    return [initialState, jest.fn()];
  });

  // mock useEffect
  jest.spyOn(React, "useEffect").mockImplementation((f) => f());
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

export {};
