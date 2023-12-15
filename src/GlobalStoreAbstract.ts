import {
  ActionCollectionConfig,
  StateSetter,
  StateConfigCallbackParam,
  StateChangesParam,
} from "react-hooks-global-states";

import { GlobalStore } from "./GlobalStore";

import { GlobalStoreConfig, TMetadataBase } from "./GlobalStore.types";

/**
 * @description
 * Use this class to extends the capabilities of the GlobalStore.
 * by implementing the abstract methods onInitialize and onChange.
 * You can use this class to create a store with async storage.
 */
export abstract class GlobalStoreAbstract<
  TState,
  TMetadata extends Record<string, unknown>,
  TStateSetter extends
    | ActionCollectionConfig<TState, TMetadataBase<TMetadata>>
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
    parameters: StateConfigCallbackParam<
      TState,
      TMetadataBase<TMetadata>,
      TStateSetter
    >
  ) => {
    this.onInitialize(parameters);
  };

  protected onStateChanged = (
    parameters: StateChangesParam<
      TState,
      TMetadataBase<TMetadata>,
      TStateSetter
    >
  ) => {
    this.onChange(parameters);
  };

  protected abstract onInitialize: ({
    setState,
    setMetadata,
    getMetadata,
    getState,
    actions,
  }: StateConfigCallbackParam<
    TState,
    TMetadataBase<TMetadata>,
    TStateSetter
  >) => void;

  protected abstract onChange: ({
    setState,
    setMetadata,
    getMetadata,
    getState,
    actions,
  }: StateChangesParam<TState, TMetadataBase<TMetadata>, TStateSetter>) => void;
}
