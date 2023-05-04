import { combineAsyncGetters } from "../src/GlobalStore.combiners";
import { createGlobalStateWithDecoupledFuncs } from "../src/GlobalStore.functionHooks";

describe("combiners", () => {
  it("should combine two global states", () => {
    const [, getter1, setter1] = createGlobalStateWithDecoupledFuncs({
      a: 1,
    });
    const [, getter2, setter2] = createGlobalStateWithDecoupledFuncs({
      b: 2,
    });
    const [useDerivate, getState] = combineAsyncGetters(
      {
        selector: ([a, b]) => ({
          ...a,
          ...b,
        }),
      },
      getter1,
      getter2
    );
    let [data] = useDerivate();
    expect(data).toEqual({
      a: 1,
      b: 2,
    });
  });
});
