import type { ActionCollectionConfig, StateChanges, StoreTools } from "react-hooks-global-states/types";

import type { BaseMetadata, StateMeta } from "./types";

import { GlobalStore } from "./GlobalStore";

export abstract class GlobalStoreAbstract<
  State,
  Metadata extends BaseMetadata | unknown,
  ActionsConfig extends ActionCollectionConfig<State, StateMeta<Metadata>> | unknown
> extends GlobalStore<State, Metadata, ActionsConfig> {
  protected override onInit = (args: StoreTools<State, StateMeta<Metadata>>) => {
    this._onInitialize(args as StoreTools<State, Metadata>);
    this.onInitialize?.(args);
  };

  protected override onStateChanged = (
    args: StoreTools<State, StateMeta<Metadata>> & StateChanges<State>
  ) => {
    this._onInitialize(args as StoreTools<State, Metadata> & StateChanges<State>);
    this.onChange?.(args);
  };

  protected abstract onInitialize: (args: StoreTools<State, StateMeta<Metadata>>) => void;

  protected abstract onChange: (args: StoreTools<State, StateMeta<Metadata>> & StateChanges<State>) => void;
}
