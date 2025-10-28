import type {
  StateHook,
  StateSetter,
  ActionCollectionConfig,
  ActionCollectionResult,
  GlobalStoreCallbacks,
} from "react-hooks-global-states/types";

import { AsyncStorageConfig, BaseMetadata, StateMeta } from "./types";
import { GlobalStore } from "./GlobalStore";

export type { InferActionsType } from "react-hooks-global-states/createGlobalState";

export interface CreateGlobalState {
  <State>(state: State): StateHook<State, StateSetter<State>, BaseMetadata>;

  <
    State,
    Metadata extends BaseMetadata | unknown,
    ActionsConfig extends ActionCollectionConfig<State, Metadata> | null | {},
    PublicStateMutator = keyof ActionsConfig extends never | undefined
      ? StateSetter<State>
      : ActionCollectionResult<State, Metadata, NonNullable<ActionsConfig>>
  >(
    state: State,
    args: {
      name?: string;
      metadata?: Metadata;
      callbacks?: GlobalStoreCallbacks<State, Metadata>;
      actions?: ActionsConfig;
      asyncStorage?: AsyncStorageConfig;
    }
  ): StateHook<State, PublicStateMutator, StateMeta<Metadata>>;

  <
    State,
    Metadata extends BaseMetadata | unknown,
    ActionsConfig extends ActionCollectionConfig<State, StateMeta<Metadata>>
  >(
    state: State,
    args: {
      name?: string;
      metadata?: Metadata;
      callbacks?: GlobalStoreCallbacks<State, Metadata>;
      actions: ActionsConfig;
      asyncStorage?: AsyncStorageConfig;
    }
  ): StateHook<State, ActionCollectionResult<State, StateMeta<Metadata>, ActionsConfig>, Metadata>;
}

export const createGlobalState = ((
  state: unknown,
  args: {
    name?: string;
    metadata?: unknown;
    callbacks?: GlobalStoreCallbacks<unknown, unknown>;
    actions?: ActionCollectionConfig<unknown, unknown>;
    asyncStorage?: AsyncStorageConfig;
  }
) => new GlobalStore(state, args).getHook()) as CreateGlobalState;

export default createGlobalState;
