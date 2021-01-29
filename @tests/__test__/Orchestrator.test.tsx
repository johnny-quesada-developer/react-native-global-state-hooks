import * as hooksDecoupled from '../hooksDecoupled';
import Orchestrator from '../Orchestrator';
import React from 'react';
import ReactDom from 'react-dom';
import Stage1 from '../Stage1';
import Stage2 from '../Stage2';
import Stage3 from '../Stage3';
import renderer from 'react-test-renderer';

describe('Orchestrator', () => {
  const createOrchestrator = (): renderer.ReactTestRenderer => {
    let wrapper: renderer.ReactTestRenderer | null = null;

    renderer.act(() => {
      wrapper = renderer.create(<Orchestrator />);
    });

    return wrapper as unknown as renderer.ReactTestRenderer;
  };

  beforeEach(() => {
    // avoid warn: You should try avoid call the same state-setter multiple times at one execution line
    jest.spyOn(console, 'warn').mockImplementation(jest.fn());
  });

  describe('render', () => {
    it('Should render correclty, no re-renders', () => {
      const wrapper = createOrchestrator();

      expect(Stage1).toHaveBeenCalledTimes(1);
      expect(Stage2).toHaveBeenCalledTimes(1);
      expect(Stage3).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    });
  });

  describe('hooks', () => {
    const testNumericHook = (hookName: keyof typeof hooksDecoupled) => {
      let orchestratorWrapper: renderer.ReactTestRenderer;
      let getter: any;
      let setter: any;
      let increaseValue: () => Promise<unknown>;
      let decreaseValue: () => Promise<unknown>;
      let checkCurrentValue: (newValue: number) => Promise<void>;
      let unstableBatchedUpdatesSpy: jest.SpyInstance<any>;

      beforeEach(async () => {
        orchestratorWrapper = await createOrchestrator();
        [getter, setter] = hooksDecoupled[hookName];
        increaseValue = () => Promise.resolve();
        decreaseValue = () => Promise.resolve();

        if (typeof setter === 'function') {
          increaseValue = (): Promise<void> => setter((currentValue: number) => currentValue + 1);
          decreaseValue = (): Promise<void> => setter((currentValue: number) => currentValue - 1);
        } else {
          increaseValue = (): Promise<void> => setter.increase(1);
          decreaseValue = (): Promise<void> => setter.decrease(1);
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        checkCurrentValue = (_newValue: number) => Promise.resolve();
        if (typeof getter === 'function') {
          checkCurrentValue = async (newValue: number) => {
            const result = getter();
            const promise = Promise.resolve(result) === result ? result : Promise.resolve(result);
            const currentValue = await promise;

            expect(currentValue).toBe(newValue);
          };
        }

        unstableBatchedUpdatesSpy = jest.spyOn(ReactDom, 'unstable_batchedUpdates');
      });

      afterAll(() => {
        orchestratorWrapper.unmount();
      });

      const checkFirstRender = async () => {
        await checkCurrentValue(0);
        [Stage1, Stage2, Stage3].forEach((stage) => {
          expect(stage).toHaveBeenCalledTimes(1);
        });
      };

      it('check initial state [1 render]', async () => {
        await checkFirstRender();
      });

      it('check all state updates should be batched [2 renders]', async () => {
        await checkFirstRender();

        await renderer.act(async () => {
          // 0
          increaseValue();
          increaseValue();
          decreaseValue();
          increaseValue();
          await increaseValue();
          await checkCurrentValue(3);
        });

        // just one batch of changes
        expect(unstableBatchedUpdatesSpy).toHaveBeenCalledTimes(1);

        // note that even calling 3 times the increase/decrease functions...
        // the render is just gonna happen once, all changes are batch
        [Stage1, Stage2].forEach((stage) => {
          expect(stage).toHaveBeenCalledTimes(2); // first render and last update
        });
      });

      it('decoupled hooks should not perform renders', async () => {
        expect(Stage3).toHaveBeenCalledTimes(1);

        await renderer.act(async () => {
          await increaseValue();
          await checkCurrentValue(4);
        });

        expect(Stage3).toHaveBeenCalledTimes(1);
        [Stage1, Stage2].forEach((stage) => {
          expect(stage).toHaveBeenCalledTimes(2); // first render and last update
        });
      });
    };

    describe('countStoreDecoupled', () => {
      testNumericHook('countStoreDecoupled');
    });

    describe('countPercistDecoupled', () => {
      testNumericHook('countPercistDecoupled');
    });

    describe('countWithActionsDecoupled', () => {
      testNumericHook('countWithActionsDecoupled');
    });

    describe('countWithActionsTypedDecoupled', () => {
      testNumericHook('countWithActionsTypedDecoupled');
    });

    describe('countWithActionsDecoupledP', () => {
      testNumericHook('countWithActionsDecoupledP');
    });
  });
});

export default {};
