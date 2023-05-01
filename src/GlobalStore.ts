import { shallowCompare } from "./GlobalStore.utils";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";

import {
  ActionCollectionConfig,
  StateSetter,
  GlobalStoreConfig,
  ActionCollectionResult,
  StateConfigCallbackParam,
  StateChangesParam,
  MetadataSetter,
  UseHookConfig,
} from "./GlobalStore.types";

const throwWrongKeyOnActionCollectionConfig = (action_key: string) => {
  throw new Error(`[WRONG CONFIGURATION!]: Every key inside the storeActionsConfig must be a higher order function that returns a function \n[${action_key}]: key is not a valid function, try something like this: \n{\n
    ${action_key}: (param) => ({ setState, getState, setMetadata, getMetadata }) => {\n
      setState((state) => ({ ...state, ...param }))\n
    }\n
}\n`);
};

/**
 * The GlobalStore class is the main class of the library and it is used to create a GlobalStore instances
 * @template {TState} TState - The type of the state object
 * @template {TMetadata} TMetadata - The type of the metadata object (optional) (default: null) no reactive information set to share with the subscribers
 * @template {TStateSetter} TStateSetter - The type of the actionsConfig object (optional) (default: null) if a configuration is passed, the hook will return an object with the actions then all the store manipulation will be done through the actions
 * */
export class GlobalStore<
  TState,
  TMetadata = null,
  TStateSetter extends
    | ActionCollectionConfig<TState, TMetadata>
    | StateSetter<TState> = StateSetter<TState>
> {
  /**
   * list of all the subscribers setState functions
   * @template {TState} TState - The type of the state object
   * */
  public subscribers: Map<
    Dispatch<
      SetStateAction<{
        state: unknown;
      }>
    >,
    {
      selector?: (state: TState) => unknown;
      config?: UseHookConfig<TState, any>;
      currentState?: unknown;
    }
  > = new Map();

  /**
   * additional configuration for the store
   * @template {TState} TState - The type of the state object
   * @template {TMetadata} TMetadata - The type of the metadata object (optional) (default: null) no reactive information set to share with the subscribers
   * @template {TStateSetter} TStateSetter - The type of the actionsConfig object (optional) (default: null) if a configuration is passed, the hook will return an object with the actions then all the store manipulation will be done through the actions
   * @property {GlobalStoreConfig<TState, TMetadata, TStateSetter>} config.metadata - The metadata to pass to the callbacks (optional) (default: null)
   * @property {GlobalStoreConfig<TState, TMetadata, TStateSetter>} config.onInit - The callback to execute when the store is initialized (optional) (default: null)
   * @property {GlobalStoreConfig<TState, TMetadata, TStateSetter>} config.onStateChanged - The callback to execute when the state is changed (optional) (default: null)
   * @property {GlobalStoreConfig<TState, TMetadata, TStateSetter>} config.onSubscribed - The callback to execute when a component is subscribed to the store (optional) (default: null)
   * @property {GlobalStoreConfig<TState, TMetadata, TStateSetter>} config.computePreventStateChange - The callback to execute when the state is changed to compute if the state change should be prevented (optional) (default: null)
   */
  protected config: GlobalStoreConfig<TState, TMetadata, TStateSetter> = {
    metadata: null,
  };

  /**
   * execute once the store is created
   * @template {TState} TState - The type of the state object
   * @template {TMetadata} TMetadata - The type of the metadata object (optional) (default: null) no reactive information set to share with the subscribers
   * @template {TStateSetter} TStateSetter - The type of the actionsConfig object (optional) (default: null) if a configuration is passed, the hook will return an object with the actions then all the store manipulation will be done through the actions
   * @param {StateConfigCallbackParam<TState, TMetadata, TStateSetter>} parameters - The parameters object brings the following properties: setState, getState, setMetadata, getMetadata
   * @param {Dispatch<SetStateAction<TState>>} parameters.setState - The setState function to update the state
   * @param {() => TState} parameters.getState - The getState function to get the state
   * @param {Dispatch<SetStateAction<TMetadata>>} parameters.setMetadata - The setMetadata function to update the metadata
   * @param {() => TMetadata} parameters.getMetadata - The getMetadata function to get the metadata
   * */
  protected onInit?: GlobalStoreConfig<
    TState,
    TMetadata,
    TStateSetter
  >["onInit"] = null;

  /**
   * execute every time the state is changed
   * @template {TState} TState - The type of the state object
   * @template {TMetadata} TMetadata - The type of the metadata object (optional) (default: null) no reactive information set to share with the subscribers
   * @template {TStateSetter} TStateSetter - The type of the actionsConfig object (optional) (default: null) if a configuration is passed, the hook will return an object with the actions then all the store manipulation will be done through the actions
   * @param {StateConfigCallbackParam<TState, TMetadata, TStateSetter>} parameters - The parameters object brings the following properties: setState, getState, setMetadata, getMetadata
   * @param {Dispatch<SetStateAction<TState>>} parameters.setState - The setState function to update the state
   * @param {() => TState} parameters.getState - The getState function to get the state
   * @param {Dispatch<SetStateAction<TMetadata>>} parameters.setMetadata - The setMetadata function to update the metadata
   * @param {() => TMetadata} parameters.getMetadata - The getMetadata function to get the metadata
   * */
  protected onStateChanged?: GlobalStoreConfig<
    TState,
    TMetadata,
    TStateSetter
  >["onStateChanged"] = null;

  /**
   * Execute each time a new component gets subscribed to the store
   * @template {TState} TState - The type of the state object
   * @template {TMetadata} TMetadata - The type of the metadata object (optional) (default: null) no reactive information set to share with the subscribers
   * @template {TStateSetter} TStateSetter - The type of the actionsConfig object (optional) (default: null) if a configuration is passed, the hook will return an object with the actions then all the store manipulation will be done through the actions
   * @param {StateConfigCallbackParam<TState, TMetadata, TStateSetter>} parameters - The parameters object brings the following properties: setState, getState, setMetadata, getMetadata
   * @param {Dispatch<SetStateAction<TState>>} parameters.setState - The setState function to update the state
   * @param {() => TState} parameters.getState - The getState function to get the state
   * @param {Dispatch<SetStateAction<TMetadata>>} parameters.setMetadata - The setMetadata function to update the metadata
   * @param {() => TMetadata} parameters.getMetadata - The getMetadata function to get the metadata
   * */
  protected onSubscribed?: GlobalStoreConfig<
    TState,
    TMetadata,
    TStateSetter
  >["onSubscribed"] = null;

  /**
   * Execute every time a state change is triggered and before the state is updated, it allows to prevent the state change by returning true
   * @template {TState} TState - The type of the state object
   * @template {TMetadata} TMetadata - The type of the metadata object (optional) (default: null) no reactive information set to share with the subscribers
   * @template {TStateSetter} TStateSetter - The type of the actionsConfig object (optional) (default: null) if a configuration is passed, the hook will return an object with the actions then all the store manipulation will be done through the actions
   * @param {StateConfigCallbackParam<TState, TMetadata, TStateSetter>} parameters - The parameters object brings the following properties: setState, getState, setMetadata, getMetadata
   * @param {Dispatch<SetStateAction<TState>>} parameters.setState - The setState function to update the state
   * @param {() => TState} parameters.getState - The getState function to get the state
   * @param {Dispatch<SetStateAction<TMetadata>>} parameters.setMetadata - The setMetadata function to update the metadata
   * @param {() => TMetadata} parameters.getMetadata - The getMetadata function to get the metadata
   * @returns {boolean} - true to prevent the state change, false to allow the state change
   * */
  protected computePreventStateChange?: GlobalStoreConfig<
    TState,
    TMetadata,
    TStateSetter
  >["computePreventStateChange"] = null;

  /**
   * We use a wrapper in order to be able to force the state update when necessary even with primitive types
   */
  protected stateWrapper: {
    state: TState;
  };

  /**
   * @deprecated direct modifications of the state could end up in unexpected behaviors
   */
  protected get state(): TState {
    return this.stateWrapper.state;
  }

  /**
   * Create a simple global store
   * @param {TState} state - The initial state
   * */
  constructor(state: TState);

  /**
   * Create a new global store with custom action
   * The metadata object could be null if not needed
   * The setter Object is used to define the actions that will be used to manipulate the state
   * @param {TState} state - The initial state
   * @param {TStateSetter} actionsConfig - The actions configuration object (optional) (default: null) if not null the store manipulation will be done through the actions
   * */
  constructor(
    state: TState,
    config: GlobalStoreConfig<TState, TMetadata, TStateSetter>
  );

  /**
   * Create a new global store with custom action
   * The metadata object could be null if not needed
   * The setter Object is used to define the actions that will be used to manipulate the state
   * The config object is used to define the callbacks that will be executed during the store lifecycle
   * The lifecycle callbacks are: onInit, onStateChanged, onSubscribed and computePreventStateChange
   * @param {TState} state - The initial state
   * @param {GlobalStoreConfig<TState, TMetadata>} config - The configuration object (optional) (default: { metadata: null })
   * @param {GlobalStoreConfig<TState, TMetadata>} config.metadata - The metadata object (optional) (default: null) if not null the metadata object will be reactive
   * @param {GlobalStoreConfig<TState, TMetadata>} config.onInit - The callback to execute when the store is initialized (optional) (default: null)
   * @param {GlobalStoreConfig<TState, TMetadata>} config.onStateChanged - The callback to execute when the state is changed (optional) (default: null)
   * @param {GlobalStoreConfig<TState, TMetadata>} config.onSubscribed - The callback to execute when a new component gets subscribed to the store (optional) (default: null)
   * @param {GlobalStoreConfig<TState, TMetadata>} config.computePreventStateChange - The callback to execute every time a state change is triggered and before the state is updated, it allows to prevent the state change by returning true (optional) (default: null)
   * @param {TStateSetter} actionsConfig - The actions configuration object (optional) (default: null) if not null the store manipulation will be done through the actions
   * */
  constructor(
    state: TState,
    config: GlobalStoreConfig<TState, TMetadata, TStateSetter>,
    actionsConfig: TStateSetter
  );

  /**
   * Create a new instance of the GlobalStore
   * @param {TState} state - The initial state
   * @param {GlobalStoreConfig<TState, TMetadata>} config - The configuration object (optional) (default: { metadata: null })
   * @param {GlobalStoreConfig<TState, TMetadata>} config.metadata - The metadata object (optional) (default: null) if not null the metadata object will be reactive
   * @param {GlobalStoreConfig<TState, TMetadata>} config.onInit - The callback to execute when the store is initialized (optional) (default: null)
   * @param {GlobalStoreConfig<TState, TMetadata>} config.onStateChanged - The callback to execute when the state is changed (optional) (default: null)
   * @param {GlobalStoreConfig<TState, TMetadata>} config.onSubscribed - The callback to execute when a new component gets subscribed to the store (optional) (default: null)
   * @param {GlobalStoreConfig<TState, TMetadata>} config.computePreventStateChange - The callback to execute every time a state change is triggered and before the state is updated, it allows to prevent the state change by returning true (optional) (default: null)   * @param {TStateSetter} actionsConfig - The actions configuration object (optional) (default: null) if not null the store manipulation will be done through the actions
   * */
  constructor(
    state: TState,
    config: GlobalStoreConfig<TState, TMetadata, TStateSetter> = {},
    protected actionsConfig: TStateSetter | null = null
  ) {
    this.stateWrapper = {
      state,
    };

    this.config = {
      metadata: null,
      ...(config ?? {}),
    };

    const isExtensionClass = this.constructor !== GlobalStore;
    if (isExtensionClass) return;

    this.initialize();
  }

  protected initialize = async () => {
    const { onInit } = this;
    const { onInit: onInitFromConfig } = this.config;

    if (!onInit && !onInitFromConfig) return;

    const parameters = this.getConfigCallbackParam({});

    onInit?.(parameters);
    onInitFromConfig?.(parameters);
  };

  /**
   * set the state and update all the subscribers
   * @param {StateSetter<TState>} setter - The setter function or the value to set
   * @param {React.Dispatch<React.SetStateAction<TState>>} invokerSetState - The setState function of the component that invoked the state change (optional) (default: null) this is used to updated first the component that invoked the state change
   * */
  protected setState = ({
    invokerSetState,
    state,
    forceUpdate,
  }: {
    state: TState;
    invokerSetState?: React.Dispatch<React.SetStateAction<{ state: unknown }>>;
    forceUpdate: boolean;
  }) => {
    // update the main state
    this.stateWrapper = {
      state,
    };

    if (invokerSetState) {
      const { selector, config, currentState } =
        this.subscribers.get(invokerSetState);

      const newState = selector ? selector(state) : state;
      const compareCallback = config?.isEqual ?? shallowCompare;

      if (!forceUpdate && compareCallback(currentState, newState)) return;

      // execute first the callback of the component that invoked the state change
      invokerSetState?.({ state: newState });
    }

    // update all the subscribers
    Array.from(this.subscribers.entries()).forEach(([setState, config]) => {
      if (setState === invokerSetState) return;

      const { selector } = config;
      const newState = selector ? selector(state) : state;

      setState({ state: newState });
    });
  };

  /**
   * Set the value of the metadata property, this is no reactive and will not trigger a re-render
   * @param {MetadataSetter<TMetadata>} setter - The setter function or the value to set
   * */
  protected setMetadata: MetadataSetter<TMetadata> = (setter) => {
    const isSetterFunction = typeof setter === "function";

    const metadata = isSetterFunction
      ? (setter as (state: TMetadata) => TMetadata)(
          this.config.metadata ?? null
        )
      : setter;

    this.config = {
      ...(this.config ?? {}),
      metadata,
    };
  };

  protected getMetadata = () => this.config.metadata ?? null;

  protected getState = () => this.stateWrapper.state;

  /**
   * get the parameters object to pass to the callback functions (onInit, onStateChanged, onSubscribed, computePreventStateChange)
   * this parameters object brings the following properties: setState, getState, setMetadata, getMetadata
   * this parameter object allows to update the state, get the state, update the metadata, get the metadata
   * @param {{ invokerSetState?: React.Dispatch<React.SetStateAction<TState>> }} parameters - The setState function of the component that invoked the state change (optional) (default: null) this is used to updated first the component that invoked the state change
   * @returns {StateConfigCallbackParam<TState, TMetadata>} - The parameters object
   * */
  protected getConfigCallbackParam = ({
    invokerSetState,
  }: {
    invokerSetState?: React.Dispatch<React.SetStateAction<{ state: unknown }>>;
  }): StateConfigCallbackParam<TState, TMetadata, TStateSetter> => {
    const { setMetadata, getMetadata, getState } = this;

    const setState = this.getSetStateWrapper({ invokerSetState });

    const actions = this.getStoreActionsMap();

    return {
      setMetadata,
      getMetadata,
      getState,
      setState,
      actions,
    } as StateConfigCallbackParam<TState, TMetadata, TStateSetter>;
  };

  /**
   * Returns a custom hook that allows to handle a global state
   * @returns {[TState, TStateSetter, TMetadata]} - The state, the state setter or the actions map, the metadata
   * */
  public getHook =
    () =>
    <State = TState>(
      selector?: (state: TState) => State,
      config: UseHookConfig<TState, State> = {}
    ) => {
      const [stateWrapper, invokerSetState] = useState<{
        state: unknown;
      }>(() => {
        if (selector) {
          const state = selector(this.stateWrapper.state);

          return {
            state,
          };
        }

        return this.stateWrapper;
      });

      useEffect(() => {
        this.subscribers.set(invokerSetState, { selector, config });

        const { onSubscribed } = this;
        const { onSubscribed: onSubscribedFromConfig } = this.config;

        if (onSubscribed || onSubscribedFromConfig) {
          const parameters = this.getConfigCallbackParam({ invokerSetState });

          onSubscribed?.(parameters);
          onSubscribedFromConfig?.(parameters);
        }

        return () => {
          this.subscribers.delete(invokerSetState);
        };
      }, []);

      // we need to have access to the reference of the invokerSetState
      this.subscribers.get(invokerSetState).currentState = stateWrapper.state;

      const stateOrchestrator = useMemo(
        () => this.getStateOrchestrator(invokerSetState),
        []
      );

      type State_ = State extends never | undefined | null ? TState : State;

      type Setter = TStateSetter extends StateSetter<TState> | null | never
        ? StateSetter<TState>
        : ActionCollectionResult<TState, TMetadata, TStateSetter>;

      return [
        stateWrapper.state,
        stateOrchestrator,
        this.config.metadata ?? null,
      ] as [state: State_, setter: Setter, metadata: TMetadata];
    };

  /**
   * Returns an array with the a function to get the state, the state setter or the actions map, and a function to get the metadata
   * @returns {[() => TState, TStateSetter, () => TMetadata]} - The state getter, the state setter or the actions map, the metadata getter
   * */
  public getHookDecoupled = () => {
    const stateOrchestrator = this.getStateOrchestrator();

    const { getMetadata } = this;
    const getState = () => this.stateWrapper.state;

    return [getState, stateOrchestrator, getMetadata] as [
      () => TState,
      TStateSetter extends StateSetter<TState> | null
        ? StateSetter<TState>
        : ActionCollectionResult<TState, TMetadata, TStateSetter>,
      () => TMetadata
    ];
  };

  /**
   * returns a wrapper for the setState function that will update the state and all the subscribers
   * @param {{ invokerSetState?: React.Dispatch<React.SetStateAction<TState>> }} parameters - The setState function of the component that invoked the state change (optional) (default: null) this is used to updated first the component that invoked the state change
   * @returns {StateSetter<TState>} - The state setter
   * */
  protected getSetStateWrapper = ({
    invokerSetState,
  }: {
    invokerSetState?: React.Dispatch<React.SetStateAction<{ state: unknown }>>;
  } = {}): StateSetter<TState> => {
    const setState = ((setter: StateSetter<TState>, { forceUpdate } = {}) => {
      this.computeSetState({ invokerSetState, setter, forceUpdate });
    }) as StateSetter<TState>;

    return setState;
  };

  /**
   * Returns the state setter or the actions map
   * @param {{ invokerSetState?: React.Dispatch<React.SetStateAction<TState>> }} parameters - The setState function of the component that invoked the state change (optional) (default: null) this is used to updated first the component that invoked the state change
   * @returns {TStateSetter} - The state setter or the actions map
   * */
  protected getStateOrchestrator(
    invokerSetState?: React.Dispatch<React.SetStateAction<{ state: unknown }>>
  ) {
    const stateHasCustomActions = this.actionsConfig;

    if (stateHasCustomActions) {
      return this.getStoreActionsMap({ invokerSetState });
    }

    return this.getSetStateWrapper({ invokerSetState });
  }

  /**
   * Calculate whenever or not we should compute the callback parameters on the state change
   * @returns {boolean} - True if we should compute the callback parameters on the state change
   * */
  protected hasStateCallbacks = (): boolean => {
    const { computePreventStateChange, onStateChanged } = this;

    const {
      computePreventStateChange: computePreventStateChangeFromConfig,
      onStateChanged: onStateChangedFromConfig,
    } = this.config;

    const preventStateChangesCalls =
      computePreventStateChange || computePreventStateChangeFromConfig;

    const stateChangeCalls = onStateChanged || onStateChangedFromConfig;

    const shouldComputeParameter = preventStateChangesCalls || stateChangeCalls;

    return !!shouldComputeParameter;
  };

  /**
   * This is responsible for defining whenever or not the state change should be allowed or prevented
   * the function also execute the functions:
   * - onStateChanged (if defined) - this function is executed after the state change
   * - computePreventStateChange (if defined) - this function is executed before the state change and it should return a boolean value that will be used to determine if the state change should be prevented or not
   * @param {{ setter: StateSetter<TState>; invokerSetState?: React.Dispatch<React.SetStateAction<TState>> }} parameters - The state setter and the setState function of the component that invoked the state change (optional) (default: null) this is used to updated first the component that invoked the state change
   */
  protected computeSetState = ({
    setter,
    invokerSetState,
    forceUpdate,
  }: {
    setter: StateSetter<TState>;
    invokerSetState?: React.Dispatch<React.SetStateAction<{ state: unknown }>>;
    forceUpdate: boolean;
  }) => {
    const isSetterFunction = typeof setter === "function";
    const previousState = this.stateWrapper.state;

    const newState = isSetterFunction
      ? (setter as (state: TState) => TState)(previousState)
      : setter;

    // if the state didn't change, we don't need to do anything
    if (!forceUpdate && Object.is(this.stateWrapper.state, newState)) return;

    const itHasStateCallbacks = this.hasStateCallbacks();

    const actions = itHasStateCallbacks && this.getStoreActionsMap({});
    const setState =
      itHasStateCallbacks && this.getSetStateWrapper({ invokerSetState });

    const { setMetadata, getMetadata, getState } = this;

    const callbackParameter = {
      setMetadata,
      getMetadata,
      setState,
      getState,
      actions,
      previousState,
      state: newState,
    } as StateChangesParam<TState, TMetadata, TStateSetter>;

    const { computePreventStateChange } = this;
    const { computePreventStateChange: computePreventStateChangeFromConfig } =
      this.config;

    // check if the state change should be prevented
    if (computePreventStateChange || computePreventStateChangeFromConfig) {
      const preventStateChange =
        computePreventStateChange?.(callbackParameter) ||
        computePreventStateChangeFromConfig?.(callbackParameter);

      if (preventStateChange) return;
    }

    this.setState({
      forceUpdate,
      invokerSetState,
      state: newState,
    });

    const { onStateChanged } = this;
    const { onStateChanged: onStateChangedFromConfig } = this.config;

    if (!onStateChanged && !onStateChangedFromConfig) return;

    onStateChanged?.(callbackParameter);
    onStateChangedFromConfig?.(callbackParameter);
  };

  /**
   * This creates a map of actions that can be used to modify or interact with the state
   * @param {{ invokerSetState?: React.Dispatch<React.SetStateAction<TState>> }} parameters - The setState function of the component that invoked the state change (optional) (default: null) this is used to updated first the component that invoked the state change
   * @returns {ActionCollectionResult<TState, TMetadata, TStateSetter>} - The actions map result of the configuration object passed to the constructor
   * */
  protected getStoreActionsMap = ({
    invokerSetState,
  }: {
    invokerSetState?: React.Dispatch<React.SetStateAction<{ state: unknown }>>;
  } = {}): ActionCollectionResult<TState, TMetadata, TStateSetter> => {
    if (!this.actionsConfig) return null;

    const { actionsConfig, setMetadata } = this;
    const config = actionsConfig as ActionCollectionConfig<TState, TMetadata>;

    const actionsKeys = Object.keys(config);
    const setState: StateSetter<TState> = this.getSetStateWrapper({
      invokerSetState,
    });

    const getState = () => this.stateWrapper.state;
    const getMetadata = () => this.config.metadata;

    // we bind the functions to the actions object to allow reusing actions in the same api config by using the -this- keyword
    const actions: ActionCollectionResult<TState, TMetadata, TStateSetter> =
      actionsKeys.reduce(
        (accumulator, action_key) => ({
          ...accumulator,
          [action_key](...parameters: unknown[]) {
            const actionConfig = config[action_key];
            const action = actionConfig.apply(actions, parameters);
            const actionIsNotAFunction = typeof action !== "function";

            // we throw an error if the action is not a function, this is mandatory for the correct execution of the actions
            if (actionIsNotAFunction) {
              throwWrongKeyOnActionCollectionConfig(action_key);
            }

            // executes the actions bringing access to the state setter and a copy of the state
            const result = action.call(actions, {
              setState,
              getState,
              setMetadata,
              getMetadata,
              actions: actions as ActionCollectionResult<TState, TMetadata>,
            });

            // we return the result of the actions to the invoker
            return result;
          },
        }),
        {} as ActionCollectionResult<TState, TMetadata, TStateSetter>
      );

    return actions;
  };
}
