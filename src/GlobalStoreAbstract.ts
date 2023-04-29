import {
  StateSetter,
  StateConfigCallbackParam,
  StateChangesParam,
  ActionCollectionConfig,
  GlobalStoreConfig,
  ActionCollectionResult,
} from 'GlobalStore.types';

import { createGlobalHooks, GlobalStore } from './GlobalStore';

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
    setterConfig: TStateSetter | null = null
  ) {
    super(state, config, setterConfig);
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

export type TCustomGlobalParams<TInheritMetadata = null> = {
  onInitialize: ({
    setState,
    setMetadata,
    getMetadata,
    getState,
    actions,
  }: StateConfigCallbackParam<any, TInheritMetadata>) => void;

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
export const createCustomGlobalHooks = <TInheritMetadata = null>({
  onInitialize,
  onChange,
}: TCustomGlobalParams<TInheritMetadata>) => {
  return <
    TState,
    TMetadata extends TInheritMetadata,
    TStateSetter extends
      | ActionCollectionConfig<TState, TMetadata>
      | StateSetter<TState> = StateSetter<TState>
  >(
    state: TState,
    {
      setterConfig = null,
      ...config
    }: {
      setterConfig?: TStateSetter | null;
    } & GlobalStoreConfig<TState, TMetadata, TStateSetter> = {}
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
      parameters: StateChangesParam<TState, TMetadata, TStateSetter>
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

    return createGlobalHooks<TState, TMetadata, TStateSetter>(state, {
      ...$config,
      setterConfig,
    });
  };
};

/**
 * @description
 * Use this function to create a custom global store.
 * You can use this function to create a store with async storage.
 * This function will return a hook that you can use to access the store.
 */
export const createCustomGlobalHook = <TInheritMetadata = null>({
  onInitialize,
  onChange,
}: TCustomGlobalParams<TInheritMetadata>) => {
  const customBuilder = createCustomGlobalHooks({
    onInitialize,
    onChange,
  });

  return <
    TState,
    TMetadata extends TInheritMetadata = TInheritMetadata,
    TStateSetter extends
      | ActionCollectionConfig<TState, TMetadata>
      | StateSetter<TState> = StateSetter<TState>
  >(
    state: TState,
    {
      setterConfig = null,
      ...config
    }: {
      setterConfig?: TStateSetter | null;
    } & GlobalStoreConfig<TState, TMetadata, TStateSetter> = {}
  ) => {
    const [useHook] = customBuilder<TState, TMetadata, TStateSetter>(state, {
      ...config,
      setterConfig,
    });

    return useHook;
  };
};
