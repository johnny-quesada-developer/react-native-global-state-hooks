import { useEffect, useState } from 'react';
import {
  formatToStore,
  formatFromStore,
  clone,
} from 'json-storage-formatter';

import asyncStorage from '@react-native-async-storage/async-storage';
import * as IGlobalStore from './GlobalStoreTypes';

export type IValueWithMedaData = {
  _type_?: 'map' | 'set' | 'date';
  value?: unknown;
}

export const debounce = <T extends Function>(callback: T, wait = 300): T => {
  let timer: NodeJS.Timeout;

  return ((...args: unknown[]) => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      callback(...args);
    }, wait);
  }) as unknown as T;
};

export class GlobalStore<
  IState,
  IPersist extends string | null,
  IActions extends IGlobalStore.IActionCollectionConfig<IState> | null = null
> implements IGlobalStore.IGlobalState<IState, IPersist, IActions> {

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
    public onPersistStorageLoad: (obj: unknown) => (IState | null) = () => null,
  ) {}

  private get isStoredStateItemUpdated() {
    return this.storedStateItem !== undefined;
  }

  private storedStateItem: IState | undefined = undefined;

  protected getAsyncStoreItemPromise: Promise<IState> | null = null;

  protected asyncStorageGetItem(): Promise<string | null> {
    return asyncStorage.getItem(this.persistStoreAs as string);
  }

  protected async getAsyncStoreItem(): Promise<IState> {
    if (this.isStoredStateItemUpdated) return this.storedStateItem as IState;

    if (this.getAsyncStoreItemPromise) return this.getAsyncStoreItemPromise;

    this.getAsyncStoreItemPromise = new Promise((resolve) => {
      (async () => {
        const item = await this.asyncStorageGetItem();

        if (item) {
          let value = JSON.parse(item) as IState;

          /** This allow users to review what is been stored */
          value = this.onPersistStorageLoad(value) ?? value;

          const newState = formatFromStore(value) as IState;

          await this.globalSetter(newState);
        }

        resolve(this.state);
      })();
    });

    return this.getAsyncStoreItemPromise;
  }

  protected async asyncStorageSetItem(valueToStore: string): Promise<void> {
    await asyncStorage.setItem(this.persistStoreAs as string, valueToStore);
  }

  protected async setAsyncStoreItem(): Promise<void> {
    if (this.storedStateItem === this.state) return;

    this.storedStateItem = this.state;

    const valueToStore = formatToStore(this.state);

    await this.asyncStorageSetItem(JSON.stringify(valueToStore));
  }

  protected getStateCopy = (): IState => Object.freeze(clone(this.state));

  public getHook = <
    IApi extends IGlobalStore.IActionCollectionResult<IState, IActions> |
    null = IActions extends null ? null : IGlobalStore.IActionCollectionResult<IState, IActions>
  >() => (): [
    IState,
    IGlobalStore.IHookResult<IState, IActions, IApi>,
    IPersist extends null ? false : true extends true ? boolean : null,
  ] => {
    const [value, setter] = useState(() => this.state);

    useEffect(() => {
      this.subscribers.push(setter as IGlobalStore.StateSetter<IState>);

      if (this.isPersistStore) {
        this.getAsyncStoreItem();
      }

      return () => {
        this.subscribers = this.subscribers.filter((hook) => setter !== hook);
      };
    }, []);

    return [
      value,
      this.stateOrchestrator as IGlobalStore.IHookResult<IState, IActions, IApi>,
      this.isStoredStateItemUpdated as IPersist extends null ? false : true extends true ? boolean : null,
    ];
  };

  public getHookDecoupled = <
    IApi extends IGlobalStore.IActionCollectionResult<IState, IActions> |
    null = IActions extends null ? null : IGlobalStore.IActionCollectionResult<IState, IActions>
  > (): [() => IPersist extends string ? Promise<IState> : IState, IGlobalStore.IHookResult<IState, IActions, IApi>] => {
    const valueWrapper = this.isPersistStore ? this.getAsyncStoreItem() : () => this.state;

    return [
      valueWrapper as () => IPersist extends string ? Promise<IState> : IState,
      this.stateOrchestrator as IGlobalStore.IHookResult<IState, IActions, IApi>,
    ];
  };

  private _stateOrchestrator: IGlobalStore.StateSetter<IState> | IGlobalStore.IActionCollectionResult<IState, IActions> | null = null;

  protected get stateOrchestrator(): IGlobalStore.StateSetter<IState> | IGlobalStore.IActionCollectionResult<IState, IActions> {
    if (this._stateOrchestrator) return this._stateOrchestrator;

    if (this.actions) {
      this._stateOrchestrator = this.getActions() as IGlobalStore.IActionCollectionResult<IState, IActions>;
    } else if (this.persistStoreAs) {
      this._stateOrchestrator = this.globalSetterToPersistStoreAsync as IGlobalStore.StateSetter<IState>;
    } else {
      this._stateOrchestrator = this.globalSetter as IGlobalStore.StateSetter<IState>;
    }

    return this._stateOrchestrator as IGlobalStore.StateSetter<IState> | IGlobalStore.IActionCollectionResult<IState, IActions>;
  }

  /**
  **  [subscriber-update-callback, hook]
  */
  protected static batchedUpdates: [() => void, object][] = [];

  protected globalSetter = (setter: IState | ((state: IState) => IState)) => {
    // avoid perform multiple updates over the same state
    GlobalStore.batchedUpdates = GlobalStore.batchedUpdates.filter(([, hook]) => {
      const isSameHook = hook === this;

      if (isSameHook) {
        // eslint-disable-next-line no-console
        console.warn('You should try avoid call the same state-setter multiple times at one execution line');
      }

      return !isSameHook;
    });

    const newState: IState = typeof setter === 'function' ? (setter as (state: IState) => IState)(this.getStateCopy()) : setter;

    this.state = newState;

    // batch store updates
    GlobalStore.batchedUpdates.push([() => this.subscribers.forEach((updateChild) => updateChild(newState)), this]);
    GlobalStore.ExecutePendingBatches();
  };

  protected globalSetterToPersistStoreAsync = async (setter: IState | ((state: IState) => IState)): Promise<IState> => {
    this.globalSetter(setter);
    await this.setAsyncStoreItem();

    return this.state;
  };

  /**
   * React native cannot use unstable_batchedUpdates
  */
  static ExecutePendingBatches = () => {
    GlobalStore.batchedUpdates.forEach(([execute]) => {
      execute();
    });

    GlobalStore.batchedUpdates = [];
  }

  protected getActions = <IApi extends IGlobalStore.IActionCollectionResult<IState, IGlobalStore.IActionCollectionConfig<IState>>>(): IApi => {
    const actions = this.actions as IGlobalStore.IActionCollectionConfig<IState>;
    // Setter is allways async because of the render batch
    // but we are typing the setter as synchronous to avoid the developer has extra complexity that useState do not handle
    const setter = this.isPersistStore ? this.globalSetterToPersistStoreAsync : this.globalSetter;

    return Object.keys(actions).reduce(
      (accumulator, key) => ({
        ...accumulator,
        [key]: async (...parameres: unknown[]) => {
          let promise;
          const setterWrapper: IGlobalStore.StateSetter<IState> = (value: IState | ((state: IState) => IState)) => {
            promise = setter(value);
            return promise;
          };

          const result = actions[key](...parameres)(setterWrapper, this.getStateCopy());
          const resultPromise = Promise.resolve(result) === result ? result : Promise.resolve();

          await Promise.all([promise, resultPromise]);

          return result;
        },
      }),
      {} as IApi,
    );
  };

  public deleteAsyncStoreItem = async (): Promise<void> => {
    if (!this.isPersistStore) return;

    await asyncStorage.removeItem(this.persistStoreAs as string);
  }

}

export default GlobalStore;
