import { renderHook as renderHookBase, render as renderBase } from "@testing-library/react";

/**
 * Custom it function to run tests in both strict and non-strict mode.
 * @param name - The name of the test.
 * @param fn - The test function that receives renderHook and strict mode flag.
 * @param only - If true, runs only this test.
 */
function $it(
  name: string,
  fn: (param1: { render: typeof renderBase; renderHook: typeof renderHookBase; strict: boolean }) => void,
  { only, ...options }: { only?: boolean; strict?: boolean } = { only: false },
) {
  const executeTest = (strict: boolean) => {
    (only ? it.only : it)(`${name} ${strict && "[STRICT-MODE]"}`, () =>
      fn({
        renderHook: strict ? strictRenderHook : renderHookBase,
        render: strict ? strictRender : renderBase,
        strict,
      }),
    );
  };

  if (options.strict !== false) {
    executeTest(true);
  }

  if (options.strict !== true) {
    executeTest(false);
  }
}

const strictRenderHook = ((...[param1, param2]: Parameters<typeof renderHookBase>) => {
  return renderHookBase(param1, {
    ...param2,
    reactStrictMode: true,
  });
}) as typeof renderHookBase;

const strictRender = ((...[param1, param2]: Parameters<typeof renderBase>) => {
  return renderBase(param1, {
    ...param2,
    reactStrictMode: true,
  });
}) as typeof renderBase;

$it.only = (
  name: string,
  fn: (param1: { render: typeof renderBase; renderHook: typeof renderHookBase; strict: boolean }) => void,
  options?: { strict?: boolean },
) => {
  $it(name, fn, { only: true, ...options });
};

export default $it;
