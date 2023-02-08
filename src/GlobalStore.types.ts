/**
 * @param {StateSetter<IState>} setter - add a new value to the state
 * @returns {void} result - void
 */
export type StateSetter<IState> = (
  setter: IState | ((state: IState) => IState)
) => void;

/**
 * This is the structure required by the API actions in order to be able to capture action parameters and inject state setter into actions.
 */
export type ActionConfig<IState> = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...params: any[]
) => (setter: StateSetter<IState>, currentState: IState) => unknown;

/**
 * Configuration of you API
 */
export interface ActionCollectionConfig<IState> {
  [key: string]: ActionConfig<IState>;
}

/**
 * This is the API result of the hook (if you passed an API as a parameter)
 */
export type ActionCollectionResult<
  IState,
  IActions extends ActionCollectionConfig<IState> | null
> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key in keyof IActions]: (...params: any[]) => unknown;
};

/**
 * Hook result, if you passed an API as a parameter it will be returned in the second position of the hook invoke.
 */
export type HookResult<
  IState,
  IActions extends ActionCollectionConfig<IState> | null = null,
  IApi extends ActionCollectionResult<
    IState,
    IActions
  > | null = IActions extends null
    ? null
    : ActionCollectionResult<IState, IActions>
> = IApi extends null
  ? StateSetter<IState>
  : IActions extends ActionCollectionConfig<IState>
  ? IApi extends ActionCollectionResult<IState, IActions>
    ? IApi
    : StateSetter<IState>
  : StateSetter<IState>;
