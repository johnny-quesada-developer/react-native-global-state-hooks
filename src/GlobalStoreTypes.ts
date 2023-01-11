/**
* @param {StateSetter<IState>} setter - add a new value to the state
* @returns {void} result - void
*/
export type StateSetter<IState> = (
  setter: IState | ((state: IState) => IState),
) => void;

/**
* This is the structure required by the API actions in order to be able to capture action parameters and inject state setter into actions.
*/
export type IActionConfig<IState> = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...params: any[]
) => (setter: StateSetter<IState>, currentState: IState) => Promise<unknown>;

/**
* Configuration of you API
*/
export interface IActionCollectionConfig<IState> {
  [key: string]: IActionConfig<IState>;
}

/**
* This is the API result of the hook (if you passed an API as a parameter)
*/
export type IActionCollectionResult<IState, IActions extends IActionCollectionConfig<IState> | null> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key in keyof IActions]: (...params: any[]) => unknown;
};

/**
* Hook result, if you passed an API as a parameter it will be returned in the second position of the hook invoke.
*/
export type IHookResult<
  IState,
  IActions extends IActionCollectionConfig<IState> | null = null,
  IApi extends IActionCollectionResult<IState, IActions> | null = IActions extends null ? null : IActionCollectionResult<IState, IActions>
> = IApi extends null
  ? StateSetter<IState>
  : IActions extends IActionCollectionConfig<IState>
  ? IApi extends IActionCollectionResult<IState, IActions>
    ? IApi
    : StateSetter<IState>
  : StateSetter<IState>;

/**
* This is a class to create global-store objects
* @template IState
* @param {IState} state - Initial state,
* @template IPersist
* @param {IPersist} persistStoreAs -  A name that indicates if the store should be persisted at the asyncStorage
* @template IsPersist
* @param {IsPersist} isPersist - Calculated flag that indicates if the store is persisted
* @template IActions
* @param {IActions} actions - An specific api to restrict the use of the state,
* this will disable the default return of the state-setter of the hook, and instead will return the API
* @param {string} persistStoreAs - A name if you want to persist the state of the store in localstorage
* */
export interface IGlobalState<
  IState,
  IPersist extends string | null = null,
  IActions extends IActionCollectionConfig<IState> | null = null
> {

  persistStoreAs: IPersist;

  isPersistStore: boolean;

  /**
  * This function can be used to format the data after it is loaded from the asyncStorage
  */
  onPersistStorageLoad: (obj: unknown) => (IState | null);

  /**
  * Returns a global hook that will share information across components by subscribing them to a specific store.
  * @return [currentState, GlobalState.IHookResult<IState, IActions, IApi>, initialStatePersistStorage | null, isUpdatedPersistStorage | null]
  */
  getHook: <IApi extends IActions extends IActionCollectionResult<IState, IActions> ? IActionCollectionResult<IState, IActions> : null>() => () => [
    IState,
    IHookResult<IState, IActions, IApi>,
    IPersist extends null ? false : true extends true ? boolean : null,
  ];

  /**
  * This is an access to the subscribers queue and to the current state of a specific store...
  * THIS IS NOT A REACT-HOOK, so you could use it everywhere example other hooks, and services.
  * @return [currentState, GlobalState.IHookResult<IState, IActions, IApi>]
  */
  getHookDecoupled: <IApi extends IActions extends IActionCollectionResult<IState, IActions> ? IActionCollectionResult<IState, IActions> : null>() => [
    () => IPersist extends string ? Promise<IState> : IState,
    IHookResult<IState, IActions, IApi>,
  ];

  deleteAsyncStoreItem: () => Promise<void>;
}
