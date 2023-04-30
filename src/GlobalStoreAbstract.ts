import {
  StateSetter,
  StateConfigCallbackParam,
  StateChangesParam,
  ActionCollectionConfig,
  GlobalStoreConfig,
  AvoidNever,
  StoreTools,
} from 'GlobalStore.types';

import {
  createGlobalStateWithDecoupledFuncs,
  GlobalStore,
} from './GlobalStore';

/**
 * @description
 * Use this class to extends the capabilities of the GlobalStore.
 * by implementing the abstract methods onInitialize and onChange.
 * You can use this class to create a store with async storage.
 */
export abstract class GlobalStoreAbstract<
  TState,
  TMetadata = null,
  TStateSetter extends
    | ActionCollectionConfig<TState, TMetadata>
    | StateSetter<TState> = StateSetter<TState>
> extends GlobalStore<TState, TMetadata, TStateSetter> {
  constructor(
    state: TState,
    config: GlobalStoreConfig<TState, TMetadata, TStateSetter> = {},
    actionsConfig: TStateSetter | null = null
  ) {
    super(state, config, actionsConfig);
  }

  protected onInit = (
    parameters: StateConfigCallbackParam<TState, TMetadata, TStateSetter>
  ) => {
    this.onInitialize(parameters);
  };

  protected onStateChanged = (
    parameters: StateChangesParam<TState, TMetadata, TStateSetter>
  ) => {
    this.onChange(parameters);
  };

  protected abstract onInitialize: ({
    setState,
    setMetadata,
    getMetadata,
    getState,
    actions,
  }: StateConfigCallbackParam<TState, TMetadata, TStateSetter>) => void;

  protected abstract onChange: ({
    setState,
    setMetadata,
    getMetadata,
    getState,
    actions,
  }: StateChangesParam<TState, TMetadata, TStateSetter>) => void;
}

export type CustomGlobalHookParams<
  TInheritMetadata = null,
  TCustomConfig = {}
> = {
  /**
   * @description
   * This function is called when the state is initialized.
   */
  onInitialize: (
    {
      setState,
      setMetadata,
      getMetadata,
      getState,
      actions,
    }: StateConfigCallbackParam<any, TInheritMetadata>,
    config: TCustomConfig
  ) => void;

  /**
   * @description
   * This function is called when the state is changed.
   */
  onChange: (
    {
      setState,
      setMetadata,
      getMetadata,
      getState,
      actions,
    }: StateChangesParam<any, TInheritMetadata>,
    config: TCustomConfig
  ) => void;
};

/**
 * @description
 * Use this function to create a custom global store.
 * You can use this function to create a store with async storage.
 */
export const createCustomGlobalStateWithDecoupledFuncs = <
  TInheritMetadata = null,
  TCustomConfig = {}
>({
  onInitialize,
  onChange,
}: CustomGlobalHookParams<TInheritMetadata, TCustomConfig>) => {
  /**
   * @description
   * Use this function to create a custom global store.
   * You can use this function to create a store with async storage or any other custom logic.
   * @param state The initial state of the store.
   * @param config The configuration of the store.
   * @returns [HOOK, DECOUPLED_GETTER, DECOUPLED_SETTER] - this is an array with the hook, the decoupled getState function and the decoupled setter of the state
   */
  return <
    TState,
    TMetadata = null,
    TStateSetter extends
      | ActionCollectionConfig<
          TState,
          AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>
        >
      | StateSetter<TState> = StateSetter<TState>
  >(
    state: TState,
    {
      config: customConfig,
      actions,
      metadata,
      onInit,
      onStateChanged,
      onSubscribed,
      computePreventStateChange,
    }: {
      config?: TCustomConfig;

      actions?: TStateSetter | null;

      metadata?: TMetadata;

      onInit?: GlobalStoreConfig<
        TState,
        AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
        TStateSetter
      >['onInit'];

      onStateChanged?: GlobalStoreConfig<
        TState,
        AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
        TStateSetter
      >['onStateChanged'];

      onSubscribed?: GlobalStoreConfig<
        TState,
        AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
        TStateSetter
      >['onSubscribed'];

      computePreventStateChange?: GlobalStoreConfig<
        TState,
        AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
        TStateSetter
      >['computePreventStateChange'];
    } = {
      config: {} as TCustomConfig,
    }
  ) => {
    const onInitWrapper = ((callBackParameters) => {
      onInitialize(
        callBackParameters as unknown as StateConfigCallbackParam<
          unknown,
          TInheritMetadata
        >,
        customConfig
      );

      onInit?.(callBackParameters);
    }) as typeof onInit;

    const onStateChangeWrapper = (
      callBackParameters: StateChangesParam<
        TState,
        AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
        TStateSetter
      >
    ) => {
      onChange(
        callBackParameters as unknown as StateChangesParam<
          unknown,
          TInheritMetadata
        >,
        customConfig
      );

      onStateChanged?.(callBackParameters);
    };

    const config = {
      actionsConfig: actions,
      metadata,
      onInit: onInitWrapper,
      onStateChanged: onStateChangeWrapper,
      onSubscribed,
      computePreventStateChange,
    };

    return createGlobalStateWithDecoupledFuncs<
      TState,
      AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
      TStateSetter
    >(state, config as unknown) as unknown as [
      useHook: () => [
        TState,
        TStateSetter,
        AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>
      ],
      getState: () => TState,
      setter: TStateSetter
    ];
  };
};

/**
 * @description
 * Use this function to create a custom global store.
 * You can use this function to create a store with async storage.
 * This function will return a hook that you can use to access the store.
 * @param state The initial state of the store.
 * @param config The configuration of the store.
 * @returns {[TState, TStateSetter, TMetadata]} The state, the state setter and the metadata of the store.
 */
export const createCustomGlobalState = <
  TInheritMetadata = null,
  TCustomConfig = {}
>({
  onInitialize,
  onChange,
}: CustomGlobalHookParams<TInheritMetadata, TCustomConfig>) => {
  const customBuilder = createCustomGlobalStateWithDecoupledFuncs<
    TInheritMetadata,
    TCustomConfig
  >({
    onInitialize,
    onChange,
  });

  type InheritMetadata = TInheritMetadata extends null | undefined | never
    ? {}
    : TInheritMetadata;

  /**
   * @description
   * Use this function to create a custom global store.
   * You can use this function to create a store with async storage or any other custom logic.
   * @param state The initial state of the store.
   * @param config The configuration of the store.
   * @returns {} - () => [TState, Setter, TMetadata] the hook that can be used to access the state and the setter of the state
   */
  return <
    TState,
    TMetadata = null,
    TStateSetter extends
      | ActionCollectionConfig<
          TState,
          AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>
        >
      | StateSetter<TState> = StateSetter<TState>
  >(
    state: TState,
    {
      config: customConfig,
      actions,
      metadata,
      onInit,
      onStateChanged,
      onSubscribed,
      computePreventStateChange,
    }: {
      /**
       * Configuration of the custom global store
       */
      config?: TCustomConfig;

      /**
       * @description
       * The type of the actionsConfig object (optional) (default: null) if a configuration is passed, the hook will return an object with the actions then all the store manipulation will be done through the actions
       */
      actions?: {
        [key: string]: (
          ...parameters: any[]
        ) => (storeTools: StoreTools<TState, TMetadata>) => unknown | void;
      } | null;

      /**
       * @param {StateConfigCallbackParam<TState, TMetadata> => void} metadata - the initial value of the metadata
       * */
      metadata?: TMetadata;

      /**
       * @param {StateConfigCallbackParam<TState, TMetadata> => void} onInit - callback function called when the store is initialized
       * @returns {void} result - void
       * */
      onInit?: (
        parameters: StateConfigCallbackParam<
          TState,
          AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
          TStateSetter
        >
      ) => void;

      /**
       * @param {StateChangesParam<TState, TMetadata> => void} onStateChanged - callback function called every time the state is changed
       * @returns {void} result - void
       */
      onStateChanged?: (
        parameters: StateChangesParam<
          TState,
          AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
          TStateSetter
        >
      ) => void;

      /**
       * @param {StateConfigCallbackParam<TState, TMetadata> => void} onSubscribed - callback function called every time a component is subscribed to the store
       * @returns {void} result - void
       */
      onSubscribed?: (
        parameters: StateConfigCallbackParam<
          TState,
          AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
          TStateSetter
        >
      ) => void;

      /**
       * @param {StateChangesParam<TState, TMetadata> => boolean} computePreventStateChange - callback function called every time the state is about to change and it allows you to prevent the state change
       * @returns {boolean} result - true if you want to prevent the state change, false otherwise
       */
      computePreventStateChange?: (
        parameters: StateChangesParam<
          TState,
          AvoidNever<TInheritMetadata> & AvoidNever<TMetadata>,
          TStateSetter
        >
      ) => boolean;
    } = {
      config: {} as TCustomConfig,
    }
  ) => {
    const [useHook] = customBuilder(state, {
      config: customConfig,
      actions: actions as TStateSetter,
      metadata,
      onInit,
      onStateChanged,
      onSubscribed,
      computePreventStateChange,
    });

    type Metadata = TMetadata extends null | undefined | never ? {} : TMetadata;

    return useHook as unknown as () => [
      TState,
      TStateSetter,
      InheritMetadata & Metadata
    ];
  };
};
