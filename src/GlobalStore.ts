import * as GlobalStoreBase from "react-hooks-global-states";

import {
  GlobalStoreConfig,
  StateChangesParam,
  TMetadataResult,
  ActionCollectionConfig,
  ActionCollectionResult,
} from "./GlobalStore.types";
import { getAsyncStorageItem, setAsyncStorageItem } from "./GlobalStore.utils";

import {
  GlobalStoreAbstract,
  MetadataGetter,
  SelectorCallback,
  StateGetter,
  StateSetter,
  UseHookConfig,
} from "react-hooks-global-states";

export class GlobalStore<
  TState,
  TMetadata = null,
  TStateSetter extends
    | ActionCollectionConfig<TState, TMetadata>
    | StateSetter<TState> = StateSetter<TState>
> extends GlobalStoreAbstract<TState, TMetadata, NonNullable<TStateSetter>> {
  protected config: GlobalStoreConfig<TState, TMetadata, TStateSetter>;

  constructor(
    state: TState,
    config: GlobalStoreConfig<TState, TMetadata, TStateSetter> = {},
    actionsConfig: TStateSetter | null = null
  ) {
    super(state, config, actionsConfig);

    const { getHookDecoupled, getHook } = this;

    this.getHookDecoupled = () =>
      getHookDecoupled() as [
        StateGetter<TState>,
        keyof TStateSetter extends never
          ? StateSetter<TState>
          : ActionCollectionResult<TState, TMetadata, TStateSetter>,
        MetadataGetter<TMetadataResult<TMetadata>>
      ];

    this.getHook = () => {
      const hook = getHook();

      type THookResult = ReturnType<typeof hook>;
      type State = THookResult[0];

      return hook as (
        selector?: SelectorCallback<TState, State>,
        config?: UseHookConfig<State>
      ) => [
        state: State,
        stateMutator: keyof TStateSetter extends never
          ? StateSetter<TState>
          : ActionCollectionResult<TState, TMetadata, TStateSetter>,
        metadata: MetadataGetter<TMetadataResult<TMetadata>>
      ];
    };

    const isExtensionClass = this.constructor !== GlobalStore;
    if (isExtensionClass) return;

    (this as GlobalStore<TState, TMetadata, TStateSetter>).initialize();
  }

  // @ts-ignore-next-line
  protected getMetadata = () => {
    const { metadata, asyncStorage } = this.config;

    if (!asyncStorage?.key) {
      return metadata ?? null;
    }

    return {
      isAsyncStorageReady: false,
      asyncStorageKey: asyncStorage?.key,
      ...(metadata ?? {}),
    } as TMetadataResult<TMetadata>;
  };

  /**
   * Returns an array with the a function to get the state, the state setter or the actions map, and a function to get the metadata
   * @returns {[() => TState, TStateSetter, () => TMetadata]} - The state getter, the state setter or the actions map, the metadata getter
   * */
  // @ts-ignore-next-line - we need to override the return type to add the metadata
  public getHookDecoupled: () => [
    StateGetter<TState>,
    keyof TStateSetter extends never
      ? StateSetter<TState>
      : ActionCollectionResult<TState, TMetadata, TStateSetter>,
    MetadataGetter<TMetadataResult<TMetadata>>
  ];

  /**
   * Returns a custom hook that allows to handle a global state
   * @returns {[TState, TStateSetter, TMetadata]} - The state, the state setter or the actions map, the metadata
   * */
  // @ts-ignore-next-line - we need to override the return type to add the metadata
  public getHook: () => () => [
    state: TState,
    stateMutator: keyof TStateSetter extends never
      ? StateSetter<TState>
      : ActionCollectionResult<TState, TMetadata, TStateSetter>,
    metadata: MetadataGetter<TMetadataResult<TMetadata>>
  ];

  protected onInitialize = ({
    setState,
    getState,
    setMetadata,
  }: GlobalStoreBase.StateConfigCallbackParam<TState, TMetadata>) => {
    (async () => {
      const localStorageKey = this.config?.asyncStorage?.key;

      if (!localStorageKey) return;

      setMetadata(
        (metadata) =>
          ({
            ...(metadata ?? {}),
            isAsyncStorageReady: false,
          } as TMetadata)
      );

      let restored: TState = await getAsyncStorageItem({
        config: this.config,
      });

      setMetadata((metadata) => ({
        ...metadata,
        isAsyncStorageReady: true,
      }));

      if (restored === null) {
        restored = getState();

        setAsyncStorageItem({
          item: restored,
          config: this.config,
        });
      }

      // force update to trigger the subscribers in case the state is the same
      setState(restored, {
        forceUpdate: true,
      });
    })();
  };

  protected onChange = ({
    getState,
  }: StateChangesParam<TState, TMetadata, TStateSetter>) => {
    setAsyncStorageItem({
      item: getState(),
      config: this.config,
    });
  };
}
