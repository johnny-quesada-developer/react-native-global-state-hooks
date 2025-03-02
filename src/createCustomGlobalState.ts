import type {
  // BaseMetadata,
  StateHook,
  StateSetter,
  ActionCollectionConfig,
  ActionCollectionResult,
  GlobalStoreCallbacks,
  CustomGlobalHookBuilderParams,
  StoreTools,
  StateChanges,
} from "react-hooks-global-states/types";

import type { AsyncStorageConfig, BaseMetadata } from "./types";
import { createGlobalState } from "./createGlobalState";

export interface CustomCreateGlobalState<
  TCustomConfig extends BaseMetadata | unknown,
  InheritMetadata extends BaseMetadata | unknown = BaseMetadata
> {
  <State>(state: State): StateHook<State, StateSetter<State>, BaseMetadata>;

  <
    State,
    Metadata extends BaseMetadata | unknown,
    ActionsConfig extends ActionCollectionConfig<State, InheritMetadata & Metadata> | null | {},
    PublicStateMutator = keyof ActionsConfig extends never | undefined
      ? StateSetter<State>
      : ActionCollectionResult<State, InheritMetadata & Metadata, NonNullable<ActionsConfig>>
  >(
    state: State,
    args: {
      name?: string;
      metadata?: Metadata;
      callbacks?: GlobalStoreCallbacks<State, InheritMetadata & Metadata>;
      actions?: ActionsConfig;
      config?: TCustomConfig;
      asyncStorage?: AsyncStorageConfig;
    }
  ): StateHook<State, PublicStateMutator, InheritMetadata & Metadata>;

  <
    State,
    Metadata extends BaseMetadata | unknown,
    ActionsConfig extends Readonly<ActionCollectionConfig<State, InheritMetadata & Metadata>>
  >(
    state: State,
    args: {
      name?: string;
      metadata?: Metadata;
      callbacks?: GlobalStoreCallbacks<State, InheritMetadata & Metadata>;
      actions: ActionsConfig;
      config?: TCustomConfig;
      asyncStorage?: AsyncStorageConfig;
    }
  ): StateHook<
    State,
    ActionCollectionResult<State, InheritMetadata & Metadata, ActionsConfig>,
    InheritMetadata & Metadata
  >;
}

export const createCustomGlobalState = <
  TCustomConfig extends BaseMetadata | unknown,
  InheritMetadata extends BaseMetadata | unknown = BaseMetadata
>({
  onInitialize,
  onChange,
}: CustomGlobalHookBuilderParams<TCustomConfig, InheritMetadata>) => {
  return ((
    state: unknown,
    {
      callbacks,
      ...args
    }: {
      name?: string;
      metadata?: unknown;
      callbacks?: GlobalStoreCallbacks<unknown, unknown>;
      actions?: ActionCollectionConfig<unknown, unknown>;
      asyncStorage?: AsyncStorageConfig;
      config?: TCustomConfig;
    } = {}
  ) => {
    return createGlobalState(state, {
      ...args,
      callbacks: {
        ...(callbacks ?? {}),
        onInit: (callBackParameters: StoreTools<any, any>) => {
          onInitialize?.(callBackParameters, args?.config);
          callbacks?.onInit?.(callBackParameters);
        },
        onStateChanged: (callBackParameters: StoreTools<any, any> & StateChanges<unknown>) => {
          onChange?.(callBackParameters, args?.config);
          callbacks?.onStateChanged?.(callBackParameters);
        },
      },
    });
  }) as CustomCreateGlobalState<TCustomConfig, InheritMetadata>;
};

export default createCustomGlobalState;
