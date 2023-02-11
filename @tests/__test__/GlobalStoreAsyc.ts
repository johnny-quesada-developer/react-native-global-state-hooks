import { GlobalStore } from '../../src/GlobalStore';

import {
  ActionCollectionConfig,
  GlobalStoreConfig,
  StateChangesParam,
  StateConfigCallbackParam,
  StateSetter,
} from '../../src/GlobalStore.types';

import { formatFromStore, formatToStore } from 'json-storage-formatter';
import { getFakeAsyncStorage } from './getFakeAsyncStorage';

const { fakeAsyncStorage: asyncStorage } = getFakeAsyncStorage();

export class GlobalStoreAsync<
  TState,
  TMetadata extends { readonly isAsyncStorageReady: boolean },
  TStateSetter extends
    | ActionCollectionConfig<TState, TMetadata>
    | StateSetter<TState>
    | null = StateSetter<TState>
> extends GlobalStore<TState, TMetadata, TStateSetter> {
  protected isAsyncStorageReady: boolean = false;

  constructor(
    state: TState,
    metadata: TMetadata = { isAsyncStorageReady: false } as TMetadata,
    setterConfig: TStateSetter | null = null,
    config: GlobalStoreConfig<TState, TMetadata, NonNullable<TStateSetter>> & {
      asyncStorageKey: string; // key of the async storage
    }
  ) {
    super(state, metadata, setterConfig, config);
  }

  /**
   * This method will be called once the store is created after the constructor,
   * this method is different from the onInit of the confg property and it won't be overriden
   */
  protected onInit = async ({
    setState,
    setMetadata,
    getMetadata,
  }: StateConfigCallbackParam<
    TState,
    TMetadata,
    NonNullable<TStateSetter>
  >) => {
    const storedItem: string = await asyncStorage.getItem('items');

    this.isAsyncStorageReady = true;

    setMetadata({
      ...getMetadata(),
      isAsyncStorageReady: true,
    });

    if (!storedItem) return;

    const jsonParsed = JSON.parse(storedItem);
    const items = formatFromStore<TState>(jsonParsed);

    setState(items);
  };

  protected onStateChanged = ({
    getState,
  }: StateChangesParam<TState, TMetadata, NonNullable<TStateSetter>>) => {
    const state = getState();
    const formattedObject: Object = formatToStore(state);
    const jsonValue = JSON.stringify(formattedObject);

    asyncStorage.setItem('items', jsonValue);
  };
}
