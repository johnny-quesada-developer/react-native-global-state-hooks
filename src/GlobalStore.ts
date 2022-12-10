import { useEffect, useState } from 'react';
import {
  cloneDeep, debounce, isNil, isNumber, isBoolean, isString,
} from 'lodash';
import asyncStorage from '@react-native-async-storage/async-storage';
import * as IGlobalStore from './GlobalStoreTypes';

export const isPrimitive = <T>(value: T) => isNil(value) || isNumber(value) || isBoolean(value) || isString(value) || typeof value === 'symbol';

export class GlobalStore<
  IState,
  IPersist extends string | null = null,
  IsPersist extends boolean = IPersist extends null ? false : true,
  IActions extends IGlobalStore.IActionCollectionConfig<IState> | null = null
> implements IGlobalStore.IGlobalState<IState, IPersist, IsPersist, IActions> {

  public subscribers: IGlobalStore.StateSetter<IState>[] = [];

  public get isPersistStore(): boolean {
    return !!this.persistStoreAs;
  }

  constructor(protected state: IState, protected actions: IActions = null as IActions, public persistStoreAs: IPersist = null as IPersist) {}

  private get isStoredStateItemUpdated() {
    return this.storedStateItem !== undefined;
  }

  private storedStateItem: IState | undefined = undefined;

  protected formatItemFromStore<T>(obj: T): unknown {
    const isArray = Array.isArray(obj);

    if (isArray) {
      return (obj as unknown as Array<unknown>).map((item) => this.formatItemFromStore(item));
    }

    return Object.keys(obj as Record<string, unknown>).filter((key) => !key.includes('_type')).reduce((acumulator, key) => {
      const type: string = obj[`${key}_type` as keyof T] as unknown as string;
      const unformatedValue = obj[key as keyof T];
      const isDateType = type === 'date';

      if (isDateType) {
        return {
          ...acumulator,
          [key]: new Date(unformatedValue as unknown as string),
        };
      }

      return {
        ...acumulator,
        [key]: isPrimitive(unformatedValue) ? unformatedValue : this.formatItemFromStore(unformatedValue),
      };
    }, {});
  }

  protected formatToStore<T>(obj: T): unknown {
    const isArray = Array.isArray(obj);

    if (isArray) {
      return (obj as unknown as Array<unknown>).map((item) => this.formatToStore(item));
    }

    return Object.keys(obj as Record<string, unknown>).reduce((acumulator, key) => {
      const value = obj[key as keyof T];
      const isDatetime = value instanceof Date;

      return ({
        ...acumulator,
        [key]: isPrimitive(value) || isDatetime ? value : this.formatToStore(value),
        [`${key}_type`]: isDatetime ? 'date' : typeof value,
      });
    }, {});
  }

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
          const value = JSON.parse(item) as IState;
          const primitive = isPrimitive(value);
          const newState = primitive || Array.isArray(value) ? value : this.formatItemFromStore(value) as IState;

          await this.globalSetterAsync(newState);
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

    const valueToStore = isPrimitive(this.state) ? this.state : this.formatToStore(cloneDeep(this.state));

    await this.asyncStorageSetItem(JSON.stringify(valueToStore));
  }

  protected getStateCopy = (): IState => Object.freeze(cloneDeep(this.state));

  public getHook = <
    IApi extends IGlobalStore.IActionCollectionResult<IState, IActions> |
    null = IActions extends null ? null : IGlobalStore.IActionCollectionResult<IState, IActions>
  >() => (): [
    IState,
    IGlobalStore.IHookResult<IState, IActions, IApi>,
    IsPersist extends true ? boolean : null,
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
      this.isStoredStateItemUpdated as IsPersist extends true ? boolean : null,
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
      this._stateOrchestrator = this.globalSetterAsync as IGlobalStore.StateSetter<IState>;
    }

    return this._stateOrchestrator as IGlobalStore.StateSetter<IState> | IGlobalStore.IActionCollectionResult<IState, IActions>;
  }

  /**
  **  [subscriber-update-callback, hook]
  */
  protected static batchedUpdates: [() => void, object][] = [];

  protected globalSetter = (setter: IState | ((state: IState) => IState), callback: () => void) => {
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
    GlobalStore.ExecutePendingBatchesCallbacks.push(callback);
    GlobalStore.ExecutePendingBatches();
  };

  protected globalSetterAsync = async (setter: IState | ((state: IState) => IState)):
    Promise<IState> => new Promise((resolve) => this.globalSetter(setter, () => resolve(this.state)));

  protected globalSetterToPersistStoreAsync = async (setter: IState | ((state: IState) => IState)): Promise<IState> => {
    await this.globalSetterAsync(setter);
    await this.setAsyncStoreItem();

    return this.state;
  };

  static ExecutePendingBatchesCallbacks: (() => void)[] = [];

  /**
   * React native cannot use unstable_batchedUpdates, it does not have any effect
  */
  static ExecutePendingBatches = debounce(() => {
    GlobalStore.batchedUpdates.forEach(([execute]) => {
      execute();
    });

    GlobalStore.batchedUpdates = [];
    GlobalStore.ExecutePendingBatchesCallbacks.forEach((callback) => callback());
    GlobalStore.ExecutePendingBatchesCallbacks = [];
  }, 0);

  protected getActions = <IApi extends IGlobalStore.IActionCollectionResult<IState, IGlobalStore.IActionCollectionConfig<IState>>>(): IApi => {
    const actions = this.actions as IGlobalStore.IActionCollectionConfig<IState>;
    // Setter is allways async because of the render batch
    // but we are typing the setter as synchronous to avoid the developer has extra complexity that useState do not handle
    const setter = this.isPersistStore ? this.globalSetterToPersistStoreAsync : this.globalSetterAsync;

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

}

export default GlobalStore;
