import { useEffect, useState } from 'react';
import {
  cloneDeep, debounce, isNil, isNumber, isBoolean, isString,
} from 'lodash';
import asyncStorage from '@react-native-async-storage/async-storage';
import ReactDOM from 'react-dom';
import * as IGlobalStore from './GlobalStoreTypes';

export const isPrimitive = <T>(value: T) => isNil(value) || isNumber(value) || isBoolean(value) || isString(value) || typeof value === 'symbol';

export class GlobalStore<
  IState,
  IPersist extends string | null = null,
  IsPersist extends boolean = IPersist extends null ? false : true,
  IActions extends IGlobalStore.IActionCollection<IState> | null = null
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

  protected formatItemFromStore<T>(obj: T): any {
    const isArray = Array.isArray(obj);

    if (isArray) {
      return (obj as unknown as Array<any>).map((item) => this.formatItemFromStore(item));
    }

    return Object.keys(obj).filter((key) => !key.includes('_type')).reduce((acumulator, key) => {
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
    }, {} as any);
  }

  protected formatToStore<T>(obj: T): any {
    const isArray = Array.isArray(obj);

    if (isArray) {
      return (obj as unknown as Array<any>).map((item) => this.formatToStore(item));
    }

    return Object.keys(obj).reduce((acumulator, key) => {
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
          const newState: IState = primitive || Array.isArray(value) ? value : this.formatItemFromStore(value);

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
    IApi extends IGlobalStore.ActionCollectionResult<IActions> | null = IActions extends null ? null : IGlobalStore.ActionCollectionResult<IActions>
  >() => (): [
    IState,
    IGlobalStore.IHookResult<IState, IActions, IApi>,
    IsPersist extends true ? boolean : null,
  ] => {
    const [value, setter] = useState(this.state);

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
    IApi extends IGlobalStore.ActionCollectionResult<IActions> | null = IActions extends null ? null : IGlobalStore.ActionCollectionResult<IActions>
  > (): [() => IPersist extends string ? Promise<IState> : IState, IGlobalStore.IHookResult<IState, IActions, IApi>] => {
    const valueWrapper = this.isPersistStore ? this.getAsyncStoreItem() : () => this.state;

    return [
      valueWrapper as () => IPersist extends string ? Promise<IState> : IState,
      this.stateOrchestrator as IGlobalStore.IHookResult<IState, IActions, IApi>,
    ];
  };

  private _stateOrchestrator: IGlobalStore.StateSetter<IState> | IGlobalStore.ActionCollectionResult<IActions> | null = null;

  protected get stateOrchestrator(): IGlobalStore.StateSetter<IState> | IGlobalStore.ActionCollectionResult<IActions> {
    if (this._stateOrchestrator) return this._stateOrchestrator;

    if (this.actions) {
      this._stateOrchestrator = this.getActions() as IGlobalStore.ActionCollectionResult<IActions>;
    } else if (this.persistStoreAs) {
      this._stateOrchestrator = this.globalSetterToPersistStoreAsync as IGlobalStore.StateSetter<IState>;
    } else {
      this._stateOrchestrator = this.globalSetterAsync as IGlobalStore.StateSetter<IState>;
    }

    return this._stateOrchestrator as IGlobalStore.StateSetter<IState> | IGlobalStore.ActionCollectionResult<IActions>;
  }

  /**
  **  [subscriber-update-callback, hook, newState]
  */
  protected static batchedUpdates: [() => void, object, object][] = [];

  protected globalSetter = (setter: Partial<IState> | ((state: IState) => Partial<IState>), callback: () => void) => {
    const partialState = typeof setter === 'function' ? setter(this.getStateCopy()) : setter;
    let newState = isPrimitive(partialState) || Array.isArray(partialState) ? partialState : { ...this.state, ...partialState };

    // avoid perform multiple update batches by accumulating state changes of the same hook
    GlobalStore.batchedUpdates = GlobalStore.batchedUpdates.filter(([, hook, previousState]) => {
      const isSameHook = hook === this;

      if (isSameHook) {
        // eslint-disable-next-line no-console
        console.warn('You should try avoid call the same state-setter multiple times at one execution line');
        newState = isPrimitive(newState) || Array.isArray(partialState) ? newState : { ...previousState, ...newState };
      }
      return !isSameHook;
    });

    this.state = newState as IState;

    // batch store updates
    GlobalStore.batchedUpdates.push([() => this.subscribers.forEach((updateChild) => updateChild(newState)), this, newState]);

    GlobalStore.ExecutePendingBatchesCallbacks.push(callback);
    GlobalStore.ExecutePendingBatches();
  };

  protected globalSetterAsync = async (setter: Partial<IState> | ((state: IState) => Partial<IState>)):
    Promise<void> => new Promise((resolve) => this.globalSetter(setter, () => resolve()));

  protected globalSetterToPersistStoreAsync = async (setter: Partial<IState> | ((state: IState) => Partial<IState>)): Promise<void> => {
    await this.globalSetterAsync(setter);
    await this.setAsyncStoreItem();
  };

  static ExecutePendingBatchesCallbacks: (() => void)[] = [];

  // avoid multiples calls to batchedUpdates
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  static ExecutePendingBatches = debounce(() => {
    const reactBatchedUpdates = ReactDOM.unstable_batchedUpdates || ((mock: () => void) => mock());

    reactBatchedUpdates(() => {
      GlobalStore.batchedUpdates.forEach(([execute]) => {
        execute();
      });
      GlobalStore.batchedUpdates = [];
      GlobalStore.ExecutePendingBatchesCallbacks.forEach((callback) => callback());
      GlobalStore.ExecutePendingBatchesCallbacks = [];
    });
  }, 0);

  protected getActions = <IApi extends IGlobalStore.ActionCollectionResult<IGlobalStore.IActionCollection<IState>>>(): IApi => {
    const actions = this.actions as IGlobalStore.IActionCollection<IState>;
    // Setter is allways async because of the render batch
    // but we are typing the setter as synchronous to avoid the developer has extra complexity that useState do not handle
    const setter = this.isPersistStore ? this.globalSetterToPersistStoreAsync : this.globalSetterAsync;

    return Object.keys(actions).reduce(
      (accumulator, key) => ({
        ...accumulator,
        [key]: async (...parameres: unknown[]) => {
          let promise;
          const setterWrapper: IGlobalStore.StateSetter<IState> = (value: Partial<IState> | ((state: IState) => Partial<IState>)) => {
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
