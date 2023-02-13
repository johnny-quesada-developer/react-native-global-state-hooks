# react-native-global-state-hooks

This is a package to easily handling global-state across your react-native-components

This utility uses the **useState** hook within a subscription pattern and **HOFs** to create a more intuitive, atomic and easy way of sharing state between components

...

...

# Creating a global store

We are gonna create a global count example **useCountGlobal.ts**:

```ts
import { GlobalStore } from 'react-native-global-state-hooks';

// initialize your store with the default value of the same.
const countStore = new GlobalStore(0);

// get the hook
export const useCountGlobal = countStore.getHook();

// inside your component just call...
const [count, setCount] = useCountGlobal(); // no paremeters are needed since this is a global store

// That's it, that's a global store... Strongly typed, with a global-hook that we could reuse cross all our react-components.

// #### Optionally you are able to use a decoupled hook,
// #### This function is linked to the store hooks but is not a hook himself.

export const [getCount, sendCount] = countStore.getHookDecoupled();

// @example
console.log(getCount()); // 0;

// components subscribed to the global hook if there are so
sendCount(5);

console.log(getCount()); // 5;
```

...

...

# Implementing your global hook into your components

Let's say we have two components **MyFirstComponent**, **MySecondComponent**, in order to use our global hook they will look just like:

```JSX
import { useCountGlobal } from './useCountGlobal'

const MyFirstComponent: React.FC = () => {
  const [count, setter] = useCountGlobal();
  const onClickAddOne = () => setter(count + 1);

  return (<Button title={`count: ${count}`} onPress={onClickAddOne} />);
}

const MySecondComponent: React.FC = () => {
  const [count, setter] = useCountGlobal();

  // it can also be use as a normal setter into a callback or other hooks
  const onClickAddTwo = useCallback(() => setter(state => state + 2), [])

  return (<Button title={`count: ${count}`} onPress={onClickAddOne} />);
}

// It's so simple to share information between components
```

Note that the only difference between this and the default **useState** hook is that you are not adding the initial value, cause you already did that when you created the store:

```ts
const countStore = new GlobalStore(0);
```

...

...

# Decoupled hook

If you want to access the global state outside a component or outside a hook, or without subscribing the component to the state changes...

This is especially useful when you want to create components that have edition access to a certain store, but they actually don't need to be reactive to the state changes, like a search component that just need to get the current state every time that is going to search the data; but actually don't need to be subscribed to the changes over the collection he is going to be filtering.

```ts
import { GlobalStore } from 'react-native-global-state-hooks';

const countStore = new GlobalStore(0);

// remember this should be used as the **useState** hook.
export const useCountGlobal = countStore.getHook();

// this functions are not hooks, and they can be used in whatever place into your code, ClassComponents, OtherHooks, Services etc.
export const [getCount, sendCount] = countStore.getHookDecoupled();
```

Let's see a trivial example:

...

```JSX
import { useCountGlobal, sendCount } from './useCountGlobal'

const CountDisplayerComponent: React.FC = () => {
  const [count] = useCountGlobal();

  return (<Text>{count}<Text/>);
}

// here we have a separate component that is gonna handle the state of the previous component we created,
// this new component is not gonna be affected by the changes applied on <CountDisplayerComponent/>
// Stage2 does not need to be updated once the global count changes
const CountManagerComponent: React.FC = () => {
  const increaseClick = useCallback(() => sendCount(count => count + 1), []);
  const decreaseClick = useCallback(() => sendCount(count => count - 1), []);

  return (<>
      <Button onPress={increaseClick} title={'increase'} />
      <Button onPress={decreaseClick} title={'decrease'}/>
    </>);
}
```

...

...

# Extending the global storage

Implementing extra functionality to extend the capabilities of the GlobalStorage couldn't be easier!!!

Here is an example of how you could create your custom store that for example stores the state into a async-storage persistente...

You could just use this code right as it is by just adding also into your project **@react-native-async-storage** or whatever another async storage library.

```ts
export class GlobalStoreAsync<
  TState,
  TMetadata extends { readonly isAsyncStorageReady: boolean },
  TStateSetter extends
    | ActionCollectionConfig<TState, TMetadata>
    | StateSetter<TState>
    | null = StateSetter<TState>
> extends GlobalStore<TState, TMetadata, TStateSetter> {
  protected isAsyncStorageReady: boolean = false;

  protected config: GlobalStoreConfig<
    TState,
    TMetadata,
    NonNullable<TStateSetter>
  > & {
    asyncStorageKey: string; // key of the async storage
  };

  constructor(
    state: TState,
    metadata: TMetadata = { isAsyncStorageReady: false } as TMetadata,
    setterConfig: TStateSetter | null = null,
    {
      onInit: onInitConfig,
      ...config
    }: GlobalStoreConfig<TState, TMetadata, NonNullable<TStateSetter>> & {
      asyncStorageKey: string; // key of the async storage
    }
  ) {
    super(state, metadata, setterConfig, config);

    const parameters = this.getConfigCallbackParam({});

    this.onInit(parameters);
    onInitConfig?.(parameters);
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
    const { asyncStorageKey } = this.config;
    const storedItem: string = await asyncStorage.getItem(asyncStorageKey);

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
    const { asyncStorageKey } = this.config;

    const state = getState();
    const formattedObject = formatToStore(state, {
      stringify: true,
    });

    asyncStorage.setItem(asyncStorageKey, formattedObject);
  };
}
```

The methods **formatToStore** and **formatFromStore** are part of another library of my [json-storage-formatter](https://www.npmjs.com/package/json-storage-formatter)...

this super small library will help you to transform objects into json string and get them back without losing any of the original data types... no more problems when **stringify** Dates, Maps, Sets, etc...

## How to use the **GlobalStoreAsync**

It will work exactly the same as the **GlobalStore**, the main difference is that by default the metadata object will include the {**isAsyncStorageReady** } which will allow you to know if the async data was already retrieved.

```ts
const [count, setCount, { isAsyncStorageReady }] = useCountGlobal();
```

...

Originally the library was implementing persistent storage by using the package **@react-native-async-storage**, but not all people want to use it or need to use it... so it has been removed. Feel free to use the above example to get back that functionality if you were using the previous versions of the package.

You could find this example on the [**GitHub** of the project](https://github.com/johnny-quesada-developer/json-storage-formatter), between the unit test sources when the case scenario was tested [GlobalStoreAsyc.ts](https://github.com/johnny-quesada-developer/react-native-global-state-hooks/blob/master/%40tests/__test__/GlobalStoreAsyc.ts)

...

...

# Restricting the manipulation of the global **state**

## Who hate reducers?

It's super common to have the wish or the necessity of restricting the manipulation of the **state** through a specific set of actions or manipulations...**Dispatches**? **Actions**? Let's make it simple BY adding a custom **API** to the configuration of our **GlobalStore**
...

```ts
const initialValue = 0;

// this is not reactive information that you could also store in the async storage
// upating the metadata will not trigger the onStateChanged method or any update on the components
const metadata = null;

const countStore = new GlobalStore(
  initialValue,
  metadata,
  {
    log: (message: string) => (): void => {
      console.log(message);
    },

    increase(message: string) {
      return (storeTools: StoreTools<number>) => {
        this.log(message);

        return storeTools.getState();
      };
    },

    decrease(message: string) {
      return (storeTools: StoreTools<number>) => {
        this.log(message);

        return storeTools.getState();
      };
    },
  } as const // the -as const- is necessary to avoid typescript errors
);

// the way to get the hook is the same as for simple setters
const useCountStore = countStore.getHook();

// now instead of a setState method, you'll get an actions object
// that contains all the actions that you defined in the setterConfig
const [count, countActions] = useCountStore();

// count is the current state - 0 (number)
// countActions is an object that contains all the actions that you defined in the setterConfig
// countActions.increase(); // this will increase the count by 1, returns the new count (number)
// countActions.decrease(); // this will decrease the count by 1, returns the new count (number)
```

...

# Configuration callbacks

## config.onInit

This method will be called once the store is created after the constructor,

@examples

```ts
import { GlobalStore } from 'react-native-global-state-hooks';

const initialValue = 0;

const store = new GlobalStore(0, null, null, {
  onInit: async ({ setMetadata, setState }) => {
    const data = await someApiCall();

    setState(data);
    setMetadata({ isDataUpdated: true });
  },
});
```

...

## config.onStateChanged

This method will be called every time the state is changed

@examples

```ts
import { GlobalStore } from 'react-native-global-state-hooks';

const store = new GlobalStore(0, null, null, {
  onStateChanged: ({ getState }) => {
    const state = getState();

    console.log(state);
  },
});
```

...

## config.onSubscribed

This method will be called every time a component is subscribed to the store

@examples

```ts
import { GlobalStore } from 'react-native-global-state-hooks';

const store = new GlobalStore(0, null, null, {
  onSubscribed: ({ getState }) => {
    console.log('A component was subscribed to the store');
  },
});
```

...

## config.computePreventStateChange

This method will be called every time the state is going to be changed, if it returns true the state won't be changed

@examples

```ts
import { GlobalStore } from 'react-native-global-state-hooks';

const store = new GlobalStore(0, null, null, {
  computePreventStateChange: ({ getState }) => {
    const state = getState();
    const shouldPrevent = state < 0;

    if (shouldPrevent) return true;

    return false;
  },
});
```

...

...

...

...

...

## Advantages:

1. Using REACT's simplest and default way to deal with the state.
2. Adding partial state designations (This is not on useState default functionality)
3. Added availability to create actions and decoupled access to the states, no more connects, and dispatches, just call your actions as a normal service of whatever other libraries.
4. This library is already taking care of avoiding re-renders if the new state does not have changes
5. This tool also take care for you to avoid **async-storage\*** data to lose the data types that you stored. For example when you are using datetimes

...

...

...

...

# Finallly notes:

Are concern about performance? this library is for you, instead of handling huge complex stores with options like redux, or by passing the setState to a context Provider (because of the limitations that the context has)... You should just use this library, we are using the more atomic and 'native' way that REACT gives to handle the state, and that is the hook **useState**...

This utility is just including the implementation of the use state into a subscriber pattern, to enable you to create hooks that will be subscribed to specific store changes, does how we'll be creating a global state hook.
