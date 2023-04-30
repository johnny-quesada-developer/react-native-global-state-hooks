import {
  StateSetter,
  StateConfigCallbackParam,
  StateChangesParam,
  ActionCollectionConfig,
  GlobalStoreConfig,
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

export type CustomGlobalHookParams<TInheritMetadata = null> = {
  /**
   * @description
   * This function is called when the state is initialized.
   */
  onInitialize: ({
    setState,
    setMetadata,
    getMetadata,
    getState,
    actions,
  }: StateConfigCallbackParam<any, TInheritMetadata>) => void;

  /**
   * @description
   * This function is called when the state is changed.
   */
  onChange: ({
    setState,
    setMetadata,
    getMetadata,
    getState,
    actions,
  }: StateChangesParam<any, TInheritMetadata>) => void;
};

/**
 * @description
 * Use this function to create a custom global store.
 * You can use this function to create a store with async storage.
 */
export const createCustomGlobalStateWithDecoupledFuncs = <
  TInheritMetadata = null
>({
  onInitialize,
  onChange,
}: CustomGlobalHookParams<TInheritMetadata>) => {
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
      | ActionCollectionConfig<TState, TMetadata & TInheritMetadata>
      | StateSetter<TState> = StateSetter<TState>
  >(
    state: TState,
    config: {
      actionsConfig?: TStateSetter | null;

      metadata?: TMetadata;

      onInit?: GlobalStoreConfig<
        TState,
        TMetadata & TInheritMetadata,
        TStateSetter
      >['onInit'];

      onStateChanged?: GlobalStoreConfig<
        TState,
        TMetadata & TInheritMetadata,
        TStateSetter
      >['onStateChanged'];

      onSubscribed?: GlobalStoreConfig<
        TState,
        TMetadata & TInheritMetadata,
        TStateSetter
      >['onSubscribed'];

      computePreventStateChange?: GlobalStoreConfig<
        TState,
        TMetadata & TInheritMetadata,
        TStateSetter
      >['computePreventStateChange'];
    } = {}
  ) => {
    const { onInit, onStateChanged, ...$config } = config ?? {};

    const onInitWrapper = ((parameters) => {
      onInitialize(
        parameters as unknown as StateConfigCallbackParam<
          unknown,
          TInheritMetadata
        >
      );

      onInit?.(parameters);
    }) as typeof onInit;

    const onStateChangeWrapper = (
      parameters: StateChangesParam<
        TState,
        TMetadata & TInheritMetadata,
        TStateSetter
      >
    ) => {
      onChange(
        parameters as unknown as StateChangesParam<unknown, TInheritMetadata>
      );
      onStateChanged?.(parameters);
    };

    Object.assign($config, {
      onInit: onInitWrapper,
      onStateChanged: onStateChangeWrapper,
    });

    return createGlobalStateWithDecoupledFuncs<
      TState,
      TMetadata & TInheritMetadata,
      TStateSetter
    >(state, $config as unknown);
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
export const createCustomGlobalState = <TInheritMetadata = null>({
  onInitialize,
  onChange,
}: CustomGlobalHookParams<TInheritMetadata>) => {
  const customBuilder =
    createCustomGlobalStateWithDecoupledFuncs<TInheritMetadata>({
      onInitialize,
      onChange,
    });

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
      | ActionCollectionConfig<TState, TMetadata & TInheritMetadata>
      | StateSetter<TState> = StateSetter<TState>
  >(
    state: TState,
    config: {
      actionsConfig?: TStateSetter | null;

      metadata?: TMetadata;

      onInit?: GlobalStoreConfig<
        TState,
        TMetadata & TInheritMetadata,
        TStateSetter
      >['onInit'];

      onStateChanged?: GlobalStoreConfig<
        TState,
        TMetadata & TInheritMetadata,
        TStateSetter
      >['onStateChanged'];

      onSubscribed?: GlobalStoreConfig<
        TState,
        TMetadata & TInheritMetadata,
        TStateSetter
      >['onSubscribed'];

      computePreventStateChange?: GlobalStoreConfig<
        TState,
        TMetadata & TInheritMetadata,
        TStateSetter
      >['computePreventStateChange'];
    } = {}
  ) => {
    const [useHook] = customBuilder<
      TState,
      TMetadata & TInheritMetadata,
      TStateSetter
    >(state, config as unknown);

    return useHook;
  };
};
