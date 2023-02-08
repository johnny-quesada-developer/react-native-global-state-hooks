import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { formatToStore, formatFromStore, clone } from 'json-storage-formatter';
import * as IGlobalStore from './GlobalStore.types';

export class GlobalStore<
  IState,
  IPersist extends string | null,
  IActions extends IGlobalStore.ActionCollectionConfig<IState> | null = null
> {
  public subscribers: IGlobalStore.StateSetter<IState>[] = [];

  public get isPersistStore(): boolean {
    return !!this.persistStoreAs;
  }

  constructor(
    protected state: IState,
    protected actions: IActions = null as IActions,
    public persistStoreAs: IPersist = null as IPersist,

    /**
     * This function can be used to format the data after it is loaded from the asyncStorage
     */
    public onPersistStorageLoad: (obj: unknown) => IState | null = () => null
  ) {}

  private get isStoredStateItemUpdated() {
    return this.storedStateItem !== undefined;
  }

  private storedStateItem: IState | undefined = undefined;

  protected getAsyncStoreItemPromise: Promise<IState> | null = null;

  protected asyncStorageGetItem(): Promise<string | null> {
    // return asyncStorage.getItem(this.persistStoreAs as string);

    return Promise.resolve(null);
  }

  protected async getAsyncStoreItem({
    invokerSetState,
  }: {
    invokerSetState?: React.Dispatch<React.SetStateAction<IState>>;
  }): Promise<IState> {
    // If the state is already updated, return it
    if (this.isStoredStateItemUpdated) return this.storedStateItem as IState;

    // If the promise to get the state is already running, return it
    if (this.getAsyncStoreItemPromise) return this.getAsyncStoreItemPromise;

    this.getAsyncStoreItemPromise = new Promise((resolve) => {
      (async () => {
        const item = await this.asyncStorageGetItem();

        if (item) {
          let value = JSON.parse(item) as IState;

          /** This allow users to review what is been stored */
          value = this.onPersistStorageLoad(value) ?? value;

          const newState = formatFromStore(value) as IState;
          const stateSetter = this.getInternalSetter({ invokerSetState });

          stateSetter(newState);
        }

        resolve(this.state);
      })();
    });

    return this.getAsyncStoreItemPromise;
  }

  protected async asyncStorageSetItem(valueToStore: string): Promise<void> {
    // await asyncStorage.setItem(this.persistStoreAs as string, valueToStore);
  }

  protected async setAsyncStoreItem(): Promise<void> {
    if (this.storedStateItem === this.state) return;

    this.storedStateItem = this.state;

    const valueToStore = formatToStore(this.state);

    await this.asyncStorageSetItem(JSON.stringify(valueToStore));
  }

  protected getStateCopy = (): IState => Object.freeze(clone(this.state));

  public getHook =
    <
      IApi extends IGlobalStore.ActionCollectionResult<
        IState,
        IActions
      > | null = IActions extends null
        ? null
        : IGlobalStore.ActionCollectionResult<IState, IActions>
    >() =>
    (): [
      IState,
      IGlobalStore.HookResult<IState, IActions, IApi>,
      IPersist extends null ? false : true extends true ? boolean : null
    ] => {
      const [value, invokerSetState] = useState(() => this.state);

      useEffect(() => {
        this.subscribers.push(
          invokerSetState as IGlobalStore.StateSetter<IState>
        );

        if (this.isPersistStore) {
          this.getAsyncStoreItem({ invokerSetState });
        }

        return () => {
          this.subscribers = this.subscribers.filter(
            (hook) => invokerSetState !== hook
          );
        };
      }, []);

      return [
        value,
        this.getStateOrchestrator(invokerSetState) as IGlobalStore.HookResult<
          IState,
          IActions,
          IApi
        >,
        this.isStoredStateItemUpdated as IPersist extends null
          ? false
          : true extends true
          ? boolean
          : null,
      ];
    };

  public getHookDecoupled = <
    IApi extends IGlobalStore.ActionCollectionResult<
      IState,
      IActions
    > | null = IActions extends null
      ? null
      : IGlobalStore.ActionCollectionResult<IState, IActions>
  >(): [
    () => IPersist extends string ? Promise<IState> : IState,
    IGlobalStore.HookResult<IState, IActions, IApi>
  ] => {
    const getState = () => {
      if (this.isPersistStore) {
        return this.getAsyncStoreItem({});
      }

      return this.state;
    };

    return [
      getState as () => IPersist extends string ? Promise<IState> : IState,
      this.getStateOrchestrator() as IGlobalStore.HookResult<
        IState,
        IActions,
        IApi
      >,
    ];
  };

  protected getInternalSetter = ({
    invokerSetState,
  }: {
    invokerSetState?: React.Dispatch<React.SetStateAction<IState>>;
  } = {}): IGlobalStore.StateSetter<IState> => {
    let stateOrchestrator: (params: {
      invokerSetState?: Dispatch<SetStateAction<IState>>;
      setter: IState | ((state: IState) => IState);
    }) => void;

    if (this.persistStoreAs) {
      stateOrchestrator = this.globalSetterToPersistStoreAsync;
    } else {
      stateOrchestrator = this.globalSetter;
    }

    return (setter) => {
      stateOrchestrator({ invokerSetState, setter });
    };
  };

  protected getStateOrchestrator(
    invokerSetState?: React.Dispatch<React.SetStateAction<IState>>
  ):
    | IGlobalStore.StateSetter<IState>
    | IGlobalStore.ActionCollectionResult<IState, IActions> {
    if (this.actions) {
      return this.getApiActions({
        invokerSetState,
      }) as IGlobalStore.ActionCollectionResult<IState, IActions>;
    }

    return this.getInternalSetter({ invokerSetState });
  }

  protected globalSetter = ({
    setter,
    invokerSetState,
  }: {
    setter: IState | ((state: IState) => IState);
    invokerSetState?: React.Dispatch<React.SetStateAction<IState>>;
  }) => {
    const newState: IState =
      typeof setter === 'function'
        ? (setter as (state: IState) => IState)(this.getStateCopy())
        : setter;

    this.state = newState;

    // execute the invoke setter before the batched updates to avoid delays on the UI
    invokerSetState?.(newState);

    // update all the subscribers
    this.subscribers.forEach((setState) => {
      if (setState === invokerSetState) return;

      setState(newState);
    });
  };

  protected globalSetterToPersistStoreAsync = async ({
    setter,
    invokerSetState,
  }: {
    setter: IState | ((state: IState) => IState);
    invokerSetState?: React.Dispatch<React.SetStateAction<IState>>;
  }): Promise<IState> => {
    this.globalSetter({ invokerSetState, setter });

    await this.setAsyncStoreItem();

    return this.state;
  };

  protected getApiActions = <
    IApi extends IGlobalStore.ActionCollectionResult<
      IState,
      IGlobalStore.ActionCollectionConfig<IState>
    >
  >({
    invokerSetState,
  }: {
    invokerSetState?: React.Dispatch<React.SetStateAction<IState>>;
  }): IApi => {
    const actionsConfig = this
      .actions as IGlobalStore.ActionCollectionConfig<IState>;
    const actionsKeys = Object.keys(actionsConfig);

    const internalSetter: IGlobalStore.StateSetter<IState> =
      this.getInternalSetter({ invokerSetState });

    const actionsApi = actionsKeys.reduce(
      (accumulator, key) => ({
        ...accumulator,
        [key]: (...parameres: unknown[]) => {
          const actionConfig = actionsConfig[key];
          const action = actionConfig(...parameres);

          // executes the actions bringing access to the state setter and a copy of the state
          const result = action(internalSetter, this.getStateCopy());

          return result;
        },
      }),
      {} as IApi
    );

    return actionsApi;
  };

  public deleteAsyncStoreItem = async (): Promise<void> => {
    if (!this.isPersistStore) return;

    // await asyncStorage.removeItem(this.persistStoreAs as string);
  };
}

export default GlobalStore;
