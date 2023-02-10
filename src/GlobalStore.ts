import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import {
  ActionCollectionConfig,
  StateSetter,
  GlobalStoreConfig,
  ActionCollectionResult,
  StateConfigCallbackParam,
  StateChangesParam,
} from './GlobalStore.types';

import { clone } from './GlobalStore.utils';

const throwWrongKeyOnActionCollectionConfig = (action_key: string) => {
  throw new Error(`[WRONG CONFIGURATION!]: Every key inside the storeActionsConfig must be a higher order function that returns a function \n[${action_key}]: key is not a valid function, try something like this: \n{\n
    ${action_key}: (param) => ({ setState, getState, setMetadata, getMetadata }) => {\n
      setState((state) => ({ ...state, ...param }))\n
    }\n
}\n`);
};

/**
 * The GlobalStore class is the main class of the library and it is used to create a GlobalStore instances
 * @template {TState} TState - The type of the state
 * @template {TMetadata} TMetadata - The type of the metadata object (optional) (default: null) no reactive information set to share with the subscribers
 * @template {ActionCollectionConfig<TState> | null} TStoreActionsConfig - The type of the actions configuration object (optional) (default: null) if not null the store manipulation will be done through the actions
 * @template {ActionCollectionResult<TState, TMetadata, NonNullable<TStoreActionsConfig>> | null} TStoreActions - The type of the actions object returned by the hook when you pass an storeActionsConfig configuration otherwise null
 * */
export class GlobalStore<
  TState,
  TMetadata,
  TStoreActionsConfig extends ActionCollectionConfig<
    TState,
    TMetadata
  > | null = null,
  // orchestrator
  TOrchestrator extends
    | StateSetter<TState>
    | ActionCollectionResult<
        TState,
        TMetadata,
        TStoreActionsConfig
      > = TStoreActionsConfig extends null
    ? StateSetter<TState>
    : ActionCollectionResult<
        TState,
        TMetadata,
        NonNullable<TStoreActionsConfig>
      >
> {
  public subscribers: Set<StateSetter<TState>> = new Set();

  /**
   * Create a new instance of the GlobalStore
   * @param {TState} state - The initial state
   * @param {TMetadata} metadata - The metadata object (optional) (default: null) no reactive information set to share with the subscribers
   * @param {TStoreActionsConfig} storeActionsConfig - The actions configuration object (optional) (default: null) if not null the store manipulation will be done through the actions
   * @param {GlobalStoreConfig<TState, TMetadata>} config - The configuration object (optional) (default: { metadata: null })
   * @param {StateConfigCallbackParam<TState, TMetadata>} config.onInit - The callback to execute when the store is initialized (optional) (default: null)
   * @param {StateConfigCallbackParam<TState, TMetadata>} config.onStateChanged - The callback to execute when the state is changed (optional) (default: null)
   * @param {StateConfigCallbackParam<TState, TMetadata>} config.onSubscribed - The callback to execute when a subscriber is added (optional) (default: null)
   * @param {StateConfigCallbackParam<TState, TMetadata>} config.computePreventStateChange - The callback to execute when the state is changed to compute if the state change should be prevented (optional) (default: null)
   * */
  constructor(
    protected state: TState,
    protected metadata: TMetadata = null,
    protected storeActionsConfig: TStoreActionsConfig = null,
    public config: GlobalStoreConfig<
      TState,
      TMetadata,
      TStoreActionsConfig
    > = {}
  ) {
    const { onInit } = this.config;
    if (!onInit) return;

    const parameters = this.getConfigCallbackParam();
    onInit(parameters);
  }

  protected getStateCopy = (): TState => clone(this.state);

  /**
   * Set the value of the metadata property, this is no reactive and will not trigger a re-render
   * @param {StateSetter<TMetadata>} setter - The setter function or the value to set
   * */
  public setMetadata: StateSetter<TMetadata> = (setter) => {
    const isSetterFunction = typeof setter === 'function';

    const metadata = isSetterFunction
      ? (setter as (state: TMetadata) => TMetadata)(this.getMetadataClone())
      : setter;

    this.metadata = metadata;
  };

  public getMetadataClone = (): TMetadata => {
    return clone(this.metadata ?? null) as TMetadata;
  };

  protected getConfigCallbackParam = (): StateConfigCallbackParam<
    TState,
    TMetadata,
    NonNullable<TStoreActionsConfig>
  > => {
    const {
      setMetadata,
      getMetadataClone: getMetadata,
      getStateCopy: getState,
    } = this;
    const setState = this.getSetStateWrapper({});

    const actions = this.getStoreActionsMap({});

    return {
      setMetadata,
      getMetadata,
      getState,
      setState,
      actions,
    };
  };

  /**
   * Returns the global hook
   * @template TStoreActionsConfigApi - The type of the actions api returned by the hook (if you passed an API as a parameter)
   * @retusn {() => [TState, StateOrchestrator<TState, TStoreActionsConfig, TStoreActionsConfigApi>, TMetadata]} - The hook function that returns the state, the state setter or the actions api (if any) and the metadata (if any)
   * */
  public getHook = () => (): [TState, TOrchestrator, TMetadata] => {
    const [value, invokerSetState] = useState(() => this.state);

    useEffect(() => {
      this.subscribers.add(invokerSetState);

      const { onSubscribed } = this.config;
      if (onSubscribed) {
        const parameters = this.getConfigCallbackParam();

        onSubscribed(parameters);
      }

      return () => {
        this.subscribers.delete(invokerSetState);
      };
    }, []);

    const stateOrchestrator = this.getStateOrchestrator(invokerSetState);

    return [value, stateOrchestrator, this.getMetadataClone()];
  };

  /**
   * Returns the orchestrator of the state setter depending on whether the state has custom actions
   * @template TStoreActionsConfigApi - The type of the actions api returned by the hook (if any) (optional)
   * @returns {[StateSetter<TState>, TStoreActionsConfigApi, TMetadata]} - The getter of the state, the state setter or the actions api (if any) and a getter of the metadata (if any)
   * */
  public getHookDecoupled = (): [
    () => TState,
    TOrchestrator,
    () => TMetadata
  ] => {
    const { getStateCopy: getState, getMetadataClone: getMetadata } = this;

    const stateOrchestrator = this.getStateOrchestrator();

    return [getState, stateOrchestrator, getMetadata];
  };

  /**
   * returns a wrapper for the setState function that will update the state and all the subscribers
   * @param {React.Dispatch<React.SetStateAction<TState>>} invokerSetState - The setState function wrapped by the hook
   * @returns {StateSetter<TState>} - The state setter
   * */
  protected getSetStateWrapper = ({
    invokerSetState,
  }: {
    invokerSetState?: React.Dispatch<React.SetStateAction<TState>>;
  } = {}): StateSetter<TState> => {
    return (setter) => {
      this.storeSetState({ invokerSetState, setter });
    };
  };

  /**
   * Returns the orchestrator of the state setter depending on whether the state has custom actions or not
   * @param {React.Dispatch<React.SetStateAction<TState>>} invokerSetState - The setState function wrapped by the hook
   * @returns {StateSetter<TState> | ActionCollectionResult<TState, TStoreActionsConfig>} - The state setter or the actions API
   * */
  protected getStateOrchestrator(
    invokerSetState?: React.Dispatch<React.SetStateAction<TState>>
  ): TOrchestrator {
    const stateHasCustomActions = this.storeActionsConfig;

    if (stateHasCustomActions) {
      return this.getStoreActionsMap({ invokerSetState }) as TOrchestrator;
    }

    return this.getSetStateWrapper({ invokerSetState }) as TOrchestrator;
  }

  /**
   * This method is responsible for updating the state and all the subscribers
   * @param {TState | ((state: TState) => TState)} setter - The new state or a function that returns the new state
   * @param {React.Dispatch<React.SetStateAction<TState>>} invokerSetState - The setState function wrapped by the hook
   * @returns {void}
   */
  protected storeSetState = ({
    setter,
    invokerSetState,
  }: {
    setter: TState | ((state: TState) => TState);
    invokerSetState?: React.Dispatch<React.SetStateAction<TState>>;
  }) => {
    const isSetterFunction = typeof setter === 'function';
    const previousState = this.getStateCopy();

    const newState = isSetterFunction
      ? (setter as (state: TState) => TState)(previousState)
      : setter;

    const { computePreventStateChange, onStateChanged } = this.config;
    const shouldComputeParameter = computePreventStateChange || onStateChanged;
    const setState = this.getSetStateWrapper({ invokerSetState });

    const {
      setMetadata,
      getMetadataClone: getMetadata,
      getStateCopy: getState,
    } = this;

    const actions = (shouldComputeParameter &&
      this.getStoreActionsMap(
        {}
      )) as NonNullable<TStoreActionsConfig> extends null
      ? null
      : ActionCollectionResult<
          TState,
          TMetadata,
          NonNullable<NonNullable<TStoreActionsConfig>>
        >;

    // check if the state change should be prevented
    if (computePreventStateChange) {
      const preventStateChange = computePreventStateChange({
        setMetadata,
        getMetadata,
        setState,
        getState,
        actions,
        previousState,
        state: newState,
      });

      if (preventStateChange) return;
    }

    // update the state
    this.state = newState;

    // execute the invoke setter before the batched updates to avoid delays on the UI
    invokerSetState?.(newState);

    // update all the subscribers
    this.subscribers.forEach((setState) => {
      if (setState === invokerSetState) return;

      setState(newState);
    });

    if (!onStateChanged) return;

    // execute the onStateChanged callback
    onStateChanged({
      setMetadata,
      getMetadata,
      setState,
      getState,
      actions,
      previousState,
      state: newState,
    });
  };

  /**
   * This method is responsible for creating the actions API
   * @param {React.Dispatch<React.SetStateAction<TState>>} invokerSetState - The setState function wrapped by the hook
   * @returns {TStoreActionsConfigApi} - The actions API with the actions as properties depending on the actions config passed to the constructor
   * */
  protected getStoreActionsMap = ({
    invokerSetState,
  }: {
    invokerSetState?: React.Dispatch<React.SetStateAction<TState>>;
  }): NonNullable<TStoreActionsConfig> extends null
    ? null
    : ActionCollectionResult<
        TState,
        TMetadata,
        NonNullable<NonNullable<TStoreActionsConfig>>
      > => {
    if (!this.storeActionsConfig) return null;

    const { storeActionsConfig, setMetadata } = this;
    const actionsConfig = storeActionsConfig as ActionCollectionConfig<
      TState,
      TMetadata
    >;

    const actionsKeys = Object.keys(actionsConfig);

    const setState: StateSetter<TState> = this.getSetStateWrapper({
      invokerSetState,
    });

    const { getStateCopy: getState, getMetadataClone: getMetadata } = this;

    // we bind the functions to the actions object to allow reusing actions in the same api config
    const actions = actionsKeys.reduce(
      (accumulator, action_key) => ({
        ...accumulator,
        [action_key](...parameres: unknown[]) {
          const actionConfig = actionsConfig[action_key];
          const action = actionConfig.apply(actions, parameres);

          const actionIsNotAFunction =
            typeof action !== 'function' || !action || !action.call;

          if (actionIsNotAFunction) {
            throwWrongKeyOnActionCollectionConfig(action_key);
          }

          // executes the actions bringing access to the state setter and a copy of the state
          const result = action.call(actions, {
            setState,
            getState,
            setMetadata,
            getMetadata,
          });

          return result;
        },
      }),
      {} as ActionCollectionResult<
        TState,
        NonNullable<TMetadata>,
        ActionCollectionConfig<TState, NonNullable<TMetadata>>
      >
    );

    return actions;
  };

  protected onInit: (
    params: StateConfigCallbackParam<TState, TMetadata, TStoreActionsConfig>
  ) => void;

  protected onStateChanged: (
    params: StateChangesParam<TState, TMetadata, TStoreActionsConfig>
  ) => void;
}

export default GlobalStore;
