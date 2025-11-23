import type {
  ActionCollectionConfig,
  GlobalStoreCallbacks,
  StateChanges,
  StoreTools,
} from "react-hooks-global-states/types";
import type {
  ActionCollectionResult,
  AsyncStorageConfig,
  BaseMetadata,
  AsyncMetadata,
  AnyFunction,
  ItemEnvelope,
} from "./types";

import { GlobalStoreAbstract } from "react-hooks-global-states/GlobalStoreAbstract";
import tryCatch from "./tryCatch";
import isNil from "json-storage-formatter/isNil";
import formatFromStore from "json-storage-formatter/formatFromStore";
import formatToStore from "json-storage-formatter/formatToStore";
import asyncStorageWrapper from "./asyncStorageWrapper";

const defaultStorageVersion = -1;

/**
 * React Native Global Store with Async Storage support
 */
export class GlobalStore<
  State,
  Metadata extends BaseMetadata,
  ActionsConfig extends ActionCollectionConfig<State, Metadata> | undefined | unknown,
  PublicStateMutator = keyof ActionsConfig extends never | undefined
    ? React.Dispatch<React.SetStateAction<State>>
    : ActionCollectionResult<State, Metadata, NonNullable<ActionsConfig>>,
> extends GlobalStoreAbstract<State, AsyncMetadata<Metadata>, ActionsConfig> {
  public asyncStorage: AsyncStorageConfig<State> | null = null;

  constructor(state: State);

  constructor(
    state: State,
    args: {
      metadata?: Metadata;
      callbacks?: GlobalStoreCallbacks<
        State,
        PublicStateMutator extends AnyFunction ? null : PublicStateMutator,
        Metadata
      >;
      actions?: ActionsConfig;
      name?: string;
      asyncStorage?: AsyncStorageConfig<State>;
    },
  );

  constructor(
    state: State,
    args: {
      metadata?: Metadata;
      callbacks?: GlobalStoreCallbacks<State, PublicStateMutator, Metadata>;
      actions?: ActionsConfig;
      name?: string;
      asyncStorage?: AsyncStorageConfig<State>;
    } = { metadata: {} as Metadata },
  ) {
    // @ts-expect-error TS2345
    super(state, args);

    this.asyncStorage = args.asyncStorage ?? null;

    // avoid changing the reference of the metadata object
    Object.assign(this.getMetadata(), {
      isAsyncStorageReady: false,
      asyncStorageKey: this.asyncStorage?.key ?? null,
    });

    const isExtensionClass = this.constructor !== GlobalStore;
    if (isExtensionClass) return;

    (this as GlobalStore<State, Metadata, ActionsConfig>).initialize();
  }

  public getMetadata = () => {
    return this.metadata as AsyncMetadata<Metadata>;
  };

  protected isPersistStorageAvailable = () => {
    return Boolean(this.asyncStorage?.key);
  };

  protected _onInitialize = async ({
    getState,
  }: StoreTools<State, PublicStateMutator, Metadata>): Promise<void> => {
    const storageConfig = this.asyncStorage;

    if (!storageConfig || !this.isPersistStorageAvailable()) return;

    // set initial value of the metadata
    this.metadata.isAsyncStorageReady = false;

    // versioning parameters
    const versioning = storageConfig.versioning;

    // try to restore the state from local storage
    const { result: restoredEnvelope, error: initializationError } = await tryCatch(
      async (): Promise<ItemEnvelope<State> | null> => {
        const getFn = storageConfig.adapter?.getItem;
        if (!getFn) return this.getStorageItem();

        return {
          s: await getFn(storageConfig.key),
          v: versioning?.version ?? defaultStorageVersion,
        };
      },
    );

    const { error } = await tryCatch(async () => {
      // error while retrieving the item from local storage
      if (initializationError) {
        this.handleStorageError(initializationError);
        await this.updateStateWithValidation(this.getState());
        return;
      }

      // nothing to restore
      if (!restoredEnvelope) {
        // set the initial state in local storage
        await this.updateStateWithValidation(getState());
        return;
      }

      const isSameVersion = restoredEnvelope.v === versioning?.version;
      const migratorFn = versioning?.migrator;

      // versions match or no migrator provided - just validate and update if possible
      // if the adapter is provided we cannot control versioning so we skip migration
      if (isSameVersion || !migratorFn || storageConfig.adapter) {
        await this.updateStateWithValidation(restoredEnvelope.s);
        return;
      }

      // [VERSIONING] try to executed a migration
      const { result: migrated, error: migrateError } = tryCatch(() => {
        return migratorFn({
          legacy: restoredEnvelope.s,
          initial: this.getState(),
        }) as unknown;
      });

      if (!migrateError) {
        await this.updateStateWithValidation(migrated as State);
        return;
      }

      this.handleStorageError(migrateError);
      await this.updateStateWithValidation(this.getState());
    });

    this.metadata.isAsyncStorageReady = true;

    if (!error) return;

    this.handleStorageError(error);
  };

  private trySetStorageItem = async (state: State) => {
    const storageConfig = this.asyncStorage;
    if (!storageConfig) return;

    const { error } = await tryCatch(() => {
      const setFn = storageConfig.adapter?.setItem;
      if (!setFn) return this.setStorageItem(state);

      return setFn(storageConfig.key, state);
    });

    if (!error) return;

    this.handleStorageError(error);
  };

  // helper to validate and update the state
  private updateStateWithValidation = async (state: State) => {
    const storageConfig = this.asyncStorage;
    if (!storageConfig) return;

    const { result: sanitizedState, error: validationError } = tryCatch(() => {
      // the typing doesn't allow nil validators, but this will prevent runtime errors on previous versions
      return storageConfig.validator?.({
        restored: state,
        initial: this.getState(),
      }) as unknown;
    });

    // there was an error during validation
    if (validationError) {
      this.handleStorageError(validationError);
      await this.trySetStorageItem(this.getState());
      return;
    }

    // no value returned from the validator
    if (sanitizedState === undefined) {
      if (state === undefined) {
        // no restored, no sanitized state, adds to the store the initial state
        await this.trySetStorageItem(this.getState());
        return;
      }

      // restored state counts like valid, add it to the state and to the storage
      // needs to force the state for compatibility with primitive types
      this.setState(state!, {
        forceUpdate: true,
      });

      await this.trySetStorageItem(state);
      return;
    }

    // add the returned value from the validator
    // needs to force the state for compatibility with primitive types
    this.setState(sanitizedState as State, {
      forceUpdate: true,
    });

    await this.trySetStorageItem(sanitizedState as State);
  };

  protected _onChange = async ({
    state,
  }: StoreTools<State, PublicStateMutator, Metadata> & StateChanges<State>): Promise<void> => {
    const storageConfig = this.asyncStorage;
    if (!storageConfig || !this.isPersistStorageAvailable()) return;

    const { error } = await tryCatch((): Promise<void> => {
      const setFn = storageConfig.adapter?.setItem;
      if (setFn) {
        return setFn(storageConfig.key, state);
      }

      return this.setStorageItem(state);
    });

    if (!error) return;

    this.handleStorageError(error);
  };

  /**
   * We set it to null so the instances of the GlobalStoreAbstract can override it.
   */
  // @ts-expect-error TS2345
  protected onInitialize = null as unknown as (args: StoreTools<State, PublicStateMutator, Metadata>) => void;

  // @ts-expect-error TS2345
  protected onChange = null as unknown as (
    args: StoreTools<State, PublicStateMutator, Metadata> & StateChanges<State>,
  ) => void;

  /**
   * Instead of calling onInitialize and onChange directly, we call the _onInitialize and _onChange
   * This allows the concat the logic of the GlobalStore with the logic of the extension class.
   */
  // @ts-expect-error TS2345
  protected onInit = (parameters: StoreTools<State, PublicStateMutator, Metadata>) => {
    void this._onInitialize?.(parameters);
  };

  // @ts-expect-error TS2345
  protected onStateChanged = (
    args: StoreTools<State, PublicStateMutator, Metadata> & StateChanges<State>,
  ) => {
    void this._onChange?.(args);
  };

  // retrieves a versioned item from the local storage
  private getStorageItem = async (): Promise<ItemEnvelope<State> | null> => {
    const json = await asyncStorageWrapper.getItem(this.asyncStorage.key);

    const restoredEnvelope = isNil(json) ? null : formatFromStore<unknown>(json);

    assertEnvelopeFormat<State>(this.asyncStorage.key, restoredEnvelope);

    return restoredEnvelope;
  };

  // add a versioned item to the local storage
  private setStorageItem = async (state: State): Promise<void> => {
    const envelope: ItemEnvelope<State> = {
      s: state,
      v: this.asyncStorage?.versioning?.version ?? defaultStorageVersion,
    };

    const formatted = formatToStore(envelope);

    return asyncStorageWrapper.setItem(this.asyncStorage.key, formatted);
  };

  private handleStorageError = (error: unknown) => {
    if (this.asyncStorage?.onError) {
      return this.asyncStorage.onError(error);
    }

    console.error(
      [
        "[react-native-global-state-hooks]\n",
        "  asyncStorage sync error:",
        `[hook]:`,
        `  ${this._name}`,
        `[AsyncStorage Key]:`,
        `  ${this.asyncStorage?.key}`,
        `[Error]:`,
        `  ${error ?? "undefined"}\n\n`,
        "Stacktrace:",
      ].join("\n"),
      (error as Error).stack,
    );
  };
}

function assertEnvelopeFormat<T>(key: string, value: unknown): asserts value is ItemEnvelope<T> | null {
  if (isNil(value)) return;
  if (typeof value === "object" && "s" in value && "v" in value) return;

  throw new Error(
    `[react-native-global-state-hooks] The value of the key "${key}" is not a valid storage envelope.`,
  );
}

export default GlobalStore;
