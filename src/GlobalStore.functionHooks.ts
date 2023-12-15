import * as GlobalStoreBase from "react-hooks-global-states";

import {
  createStateConfig,
  CustomGlobalHookParams,
  TMetadataBase,
} from "./GlobalStore.types";

import { GlobalStore } from "./GlobalStore";

import {
  ActionCollectionConfig,
  ActionCollectionResult,
  AvoidNever,
  CustomGlobalHookBuilderParams,
  StateChangesParam,
  StateConfigCallbackParam,
  StateGetter,
  StateHook,
  StateSetter,
} from "react-hooks-global-states";

/**
 * Creates a global state with the given state and config.
 * @returns {} [HOOK, DECOUPLED_GETTER, DECOUPLED_SETTER] this is an array with the hook, the decoupled getState function and the decoupled setter of the state
 */
export const createGlobalStateWithDecoupledFuncs = <
  TState,
  TMetadata extends Record<string, unknown>,
  TActions extends ActionCollectionConfig<
    TState,
    TMetadataBase<TMetadata> | TMetadata
  > | null = null
>(
  state: TState,
  { actions, ...config }: createStateConfig<TState, TMetadata, TActions> = {}
) => {
  const store = new GlobalStore<TState, TMetadata, TActions>(
    state,
    config,
    actions
  );

  const [getState, setter] = store.getHookDecoupled();

  type Setter = keyof TActions extends never
    ? StateSetter<TState>
    : ActionCollectionResult<TState, TMetadataBase<TMetadata>, TActions>;

  return [store.getHook(), getState, setter] as [
    hook: StateHook<TState, Setter, TMetadataBase<TMetadata>>,
    getter: StateGetter<TState>,
    setter: Setter
  ];
};

/**
 * Creates a global hook that can be used to access the state and actions across the application
 * @returns {} - () => [TState, Setter, TMetadata] the hook that can be used to access the state and the setter of the state
 */
export const createGlobalState = <
  TState,
  TMetadata extends Record<string, unknown>,
  TActions extends ActionCollectionConfig<
    TState,
    TMetadataBase<TMetadata>
  > | null = null
>(
  state: TState,
  config: createStateConfig<TState, TMetadata, TActions> = {}
) => {
  const [useState] = createGlobalStateWithDecoupledFuncs<
    TState,
    TMetadata,
    TActions
  >(state, config);

  return useState;
};

/**
 * @description
 * Use this function to create a custom global store.
 * You can use this function to create a store with async storage.
 */
export const createCustomGlobalStateWithDecoupledFuncs = <
  TInheritMetadata extends Record<string, unknown>,
  TCustomConfig extends Record<string, unknown>
>({
  onInitialize,
  onChange,
}: CustomGlobalHookBuilderParams<
  AvoidNever<TInheritMetadata>,
  AvoidNever<TCustomConfig>
>) => {
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
    TMetadata extends Record<string, unknown>,
    TActions extends ActionCollectionConfig<
      TState,
      TMetadataBase<TMetadata> | TMetadata
    > | null = null
  >(
    state: TState,
    {
      config: customConfig,
      onInit,
      onStateChanged,
      ...parameters
    }: GlobalStoreBase.CustomGlobalHookParams<
      TCustomConfig,
      TState,
      TMetadataBase<TMetadata> | TMetadata,
      TActions
    > = {
      config: null,
    }
  ) => {
    const onInitWrapper = (callBackParameters) => {
      onInitialize(
        callBackParameters as unknown as StateConfigCallbackParam<
          any,
          AvoidNever<TInheritMetadata>,
          StateSetter<any>
        >,
        customConfig as AvoidNever<TCustomConfig>
      );

      onInit?.(callBackParameters);
    };

    const onStateChangeWrapper = (callBackParameters) => {
      onChange(
        callBackParameters as unknown as StateChangesParam<
          any,
          AvoidNever<TInheritMetadata>,
          StateSetter<any>
        >,
        customConfig as AvoidNever<TCustomConfig>
      );

      onStateChanged?.(callBackParameters);
    };

    return createGlobalStateWithDecoupledFuncs<TState, TMetadata, TActions>(
      state,
      {
        onInit: onInitWrapper,
        onStateChanged: onStateChangeWrapper,
        ...parameters,
      }
    );
  };
};
