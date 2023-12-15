import { createDecoupledPromise } from "cancelable-promise-jq";

import {
  Subscribe,
  createGlobalStateWithDecoupledFuncs,
  combineAsyncGetters,
} from "../src";

describe("combiners", () => {
  it("should combine two global states", () => {
    const [, getter1, setter1] = createGlobalStateWithDecoupledFuncs({
      a: 1,
    });

    const [, getter2] = createGlobalStateWithDecoupledFuncs({
      b: 2,
    });

    const [useDerivate, getter] = combineAsyncGetters(
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

    expect.assertions(7);

    expect(data).toEqual({
      a: 1,
      b: 2,
    });

    let unsubscribe = getter<Subscribe>((subscribe) => {
      subscribe(
        (state) => {
          return state.a;
        },
        (state) => {
          expect(getter()).toEqual({
            a: 1,
            b: 2,
          });

          expect(state).toEqual(1);
        }
      );
    });

    unsubscribe();

    expect(getter()).toEqual({
      a: 1,
      b: 2,
    });

    let [b] = useDerivate(({ b }) => b);

    expect(b).toEqual(2);

    setter1((state) => ({
      ...state,
      a: 3,
    }));

    const decouplePromise = createDecoupledPromise();

    unsubscribe = getter<Subscribe>((subscribe) => {
      subscribe(
        (state) => {
          expect(state).toBe(getter());

          expect(getter()).toEqual({
            a: 3,
            b: 2,
          });

          unsubscribe();
          decouplePromise.resolve();
        },
        {
          skipFirst: true,
        }
      );
    });

    return decouplePromise.promise;
  });
});
