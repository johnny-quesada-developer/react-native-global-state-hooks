# react-native-global-state-hooks

This is a package to easily handling global-state across your react-native-components

This utility uses the **useState** hook within a subscription pattern and **HOFs** to create a more intuitive, atomic and easy way of sharing state between components... You can see the introduction video [here!](https://www.youtube.com/watch?v=WfoMhO1zZ04&t=8s)

For seen a running example of the hooks, you can check the following link: [react-global-state-hooks-example](https://johnny-quesada-developer.github.io/react-global-state-hooks-example/)

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
/**
 * GlobalStore is an store that could also persist the state in the async storage
 * @template {TState} TState - The state of the store
 * @template {TMetadata} TMetadata - The metadata of the store, it must contain a readonly property called isAsyncStorageReady which cannot be set from outside the store
 * @template {TStateSetter} TStateSetter - The storeActionsConfig of the store
 */
export class GlobalStore<
  TState,
  // this restriction is needed to avoid the consumers to set the isAsyncStorageReady property from outside the store,
  // ... even when the value will be ignored is better to avoid it to avoid confusion
  TMetadata extends { readonly isAsyncStorageReady: never },
  TStateSetter extends StorageSetter<TState, TMetadata> = StateSetter<TState>
> extends GlobalStoreBase<TState, StorageMetadata<TMetadata>, TStateSetter> {
  /**
   * Config for the async storage
   * includes the asyncStorageKey and the metadata which will be used to determine if the async storage is ready or not
   * @template {TState} TState - The state of the store
   * @template {TMetadata} TMetadata - The metadata of the store
   * @template {TStateSetter} TStateSetter - The storeActionsConfig of the store
   **/
  protected config: StorageConfig<TState, TMetadata, TStateSetter>;

  /**
   * Creates a new instance of the GlobalStore
   * @param {TState} state - The initial state of the store
   * @param {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config - The config of the store
   * @param  {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config.metadata - The metadata of the store which will be used to determine if the async storage is ready or not, also it could store no reactive data
   * @param  {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config.asyncStorageKey - The key of the async storage
   * @param  {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config.onInit - The callback that will be called once the store is created
   * @param  {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config.onStateChange - The callback that will be called once the state is changed
   * @param  {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config.onSubscribed - The callback that will be called every time a new component is subscribed to the store
   * @param  {GlobalStoreConfig<TState, TMetadata, ActionCollectionConfig<TState, TMetadata> | StateSetter<TState>> & { asyncStorageKey: string; }} config.computePreventStateChange - The callback that will be called before the state is changed, if it returns true the state will not be changed
   * @param {TStateSetter} setterConfig - The actions configuration object (optional) (default: null) if not null the store manipulation will be done through the actions
   */
  constructor(
    state: TState,
    config: StorageConfig<TState, TMetadata, TStateSetter> | null = null,
    setterConfig: TStateSetter | null = null
  ) {
    const { onInit, asyncStorageKey, ...configParameters } = config ?? {};

    super(state, configParameters, setterConfig as TStateSetter);

    // if there is not async storage key this is not a persistent store
    const isAsyncStorageReady = asyncStorageKey ? false : null;

    this.config = {
      ...config,
      metadata: {
        ...configParameters.metadata,
        isAsyncStorageReady,
      },
    } as StorageConfig<TState, TMetadata, TStateSetter>;

    const hasInitCallbacks = !!(asyncStorageKey || onInit);
    if (!hasInitCallbacks) return;

    const parameters = this.getConfigCallbackParam({});

    this.onInit(parameters);
    onInit?.(parameters);
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
    StorageMetadata<TMetadata>,
    NonNullable<TStateSetter>
  >) => {
    const { asyncStorageKey } = this.config;
    if (!asyncStorageKey) return;

    const storedItem: string = await asyncStorage.getItem(asyncStorageKey);

    setMetadata({
      ...getMetadata(),
      isAsyncStorageReady: true,
    });

    if (storedItem === null) return;

    const jsonParsed = JSON.parse(storedItem);
    const items = formatFromStore<TState>(jsonParsed);

    setState(items);
  };

  protected onStateChanged = ({
    getState,
  }: StateChangesParam<
    TState,
    StorageMetadata<TMetadata>,
    NonNullable<TStateSetter>
  >) => {
    const { asyncStorageKey } = this.config;
    if (!asyncStorageKey) return;

    const state = getState();
    const formattedObject = formatToStore(state, {
      stringify: true,
    });

    asyncStorage.setItem(asyncStorageKey, formattedObject);
  };
}

/**
 * Metadata of the store
 * @template {TMetadata} TMetadata - The metadata type which also contains the isAsyncStorageReady property
 */
type StorageMetadata<TMetadata> = Omit<TMetadata, 'isAsyncStorageReady'> & {
  readonly isAsyncStorageReady: boolean | null;
};

/**
 * The setter of the store
 * @template {TState} TState - The state of the store
 * @template {TMetadata} TMetadata - The metadata of the store, it must contain a readonly property called isAsyncStorageReady which cannot be set from outside the store
 * */
type StorageSetter<TState, TMetadata> =
  | ActionCollectionConfig<TState, StorageMetadata<TMetadata>>
  | StateSetter<TState>
  | null;

/**
 * Config for the async storage
 * includes the asyncStorageKey
 * @template {TState} TState - The state of the store
 * @template {TMetadata} TMetadata - The metadata of the store, it must contain a readonly property called isAsyncStorageReady which cannot be set from outside the store
 * @template {TStateSetter} TStateSetter - The storeActionsConfig of the store
 */
type StorageConfig<
  TState,
  TMetadata extends { readonly isAsyncStorageReady: never },
  TStateSetter extends
    | ActionCollectionConfig<TState, StorageMetadata<TMetadata>>
    | StateSetter<TState>
    | null = StateSetter<TState>
> = {
  asyncStorageKey?: string;

  metadata?: TMetadata;

  onInit?: (
    parameters: StateConfigCallbackParam<
      TState,
      StorageMetadata<TMetadata>,
      NonNullable<TStateSetter>
    >
  ) => void;

  onStateChanged?: (
    parameters: StateChangesParam<
      TState,
      StorageMetadata<TMetadata>,
      NonNullable<TStateSetter>
    >
  ) => void;

  onSubscribed?: (
    parameters: StateConfigCallbackParam<
      TState,
      StorageMetadata<TMetadata>,
      NonNullable<TStateSetter>
    >
  ) => void;

  computePreventStateChange?: (
    parameters: StateChangesParam<
      TState,
      StorageMetadata<TMetadata>,
      NonNullable<TStateSetter>
    >
  ) => boolean;
};
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

const config = {
  // this is not reactive information that you could also store in the async storage
  // upating the metadata will not trigger the onStateChanged method or any update on the components
  metadata: null,

  // The lifecycle callbacks are: onInit, onStateChanged, onSubscribed and computePreventStateChange
};

const countStore = new GlobalStore(
  initialValue,
  config,
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

const store = new GlobalStore(0, {
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

const store = new GlobalStore(0, {
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

const store = new GlobalStore(0, {
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

const store = new GlobalStore(0, {
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

# Examples and Comparison:

## 1. Lets try to share some state between components

### **With the GlobalStore approach, it will look like this:**

```tsx
type TUser = {
  name: string;
  email: string;
};

const useUserStore = new GlobalStore<TUser>({
  name: null,
  email: null,
}).getHook();

const Component = () => {
  const [currentUser] = useUserStore();

  return <Text>{currentUser.name}</Text>;
};
```

## Simple, right?

### Let's now see how this same thing would look like by using context:

```tsx
type TUser = {
  name: string;
  email: string;
};

const UserContext = createContext<{
  currentUser: TUser;
}>({
  currentUser: null,
});

const UserProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<TUser>(null);

  // ...get current user information

  return (
    <UserContext.Provider value={{ currentUser }}>
      {children}
    </UserContext.Provider>
  );
};

const Component = () => {
  const { currentUser } = useContext(UserContext);

  return <Text>{currentUser.name}</Text>;
};

const App = () => {
  return (
    <UserProvider>
      <Component />
    </UserProvider>
  );
};
```

### We already are able to notice a couple of extra lines right?

Let's now add another simple store to the equation

### **With the GlobalStore approach, it will look like this:**

```tsx
type TUser = {
  name: string;
  email: string;
};

const useUserStore = new GlobalStore<TUser>({
  name: null,
  email: null,
}).getHook();

// we create the store
const useCountStore = new GlobalStore(0).getHook();

const Component = () => {
  const [currentUser] = useUserStore();

  // from the component we consume the new store
  const [count, setCount] = useCountStore();

  return <Text>{currentUser.name}</Text>;
};
```

With context, we'll have again to create all the boilerplate, and wrap the component into the new provider...

### **Lets see that**

```tsx
type TUser = {
  name: string;
  email: string;
};

const UserContext = createContext<{
  currentUser: TUser;
}>({
  currentUser: null,
});

// let's create the context
const CountContext = createContext({
  count: 0,
  setCount: (() => {
    throw new Error('not implemented');
  }) as Dispatch<SetStateAction<number>>,
});

const UserProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<TUser>(null);

  // ...

  return (
    <UserContext.Provider value={{ currentUser }}>
      {children}
    </UserContext.Provider>
  );
};

// we also need another provider
const CountProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [count, setCount] = useState(0);

  return (
    <CountContext.Provider value={{ count, setCount }}>
      {children}
    </CountContext.Provider>
  );
};

// we need to wrap the component into the new provider (this is for each future context)
const App = () => {
  return (
    <UserProvider>
      <CountProvider>
        <Component />
      </CountProvider>
    </UserProvider>
  );
};

const Component = () => {
  const { currentUser } = useContext(UserContext);

  // finally we are able to get access to the new context...
  const { count, setCount } = useContext(CountContext);

  return <Text>{currentUser.name}</Text>;
};
```

In this example, we are able to see how every time along with creating a good amount of repetitive code, we also have to wrap the necessary components into the Provider... Also, notice how every time we need to modify the **App** component, even when the App component is not gonna use the new state.

### Let's make this a little more complex, now I want to implement custom methods for manipulating the count state, I also want to have the ability to modify the count state **without** having to be subscribed to the changes of the state... have you ever done that?

This is a common scenery, and guess what? in the **context** examples, we'll have to create another context, another provider, wrap and everything again...

## Let's see this time first the **context** approach

```tsx
type TUser = {
  name: string;
  email: string;
};

const UserContext = createContext<{
  currentUser: TUser;
}>({
  currentUser: null,
});

// let's remove the setter from this context
const CountContext = createContext({
  count: 0,
});

// lets create another context to share the actions
const CountContextSetter = createContext({
  increase: (): void => {
    throw new Error('increase is not implemented');
  },
  decrease: (): void => {
    throw new Error('decrease is not implemented');
  },
});

const UserProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<TUser>(null);

  // ...

  return (
    <UserContext.Provider value={{ currentUser }}>
      {children}
    </UserContext.Provider>
  );
};

// To don't overcomplicate the example let's just add but providers into this component, that will be enough
const CountProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [count, setCount] = useState(0);

  const increase = () => setCount(count + 1);
  const decrease = () => setCount(count - 1);

  return (
    //one context is gonna share the edition of the state
    <CountContext.Provider value={{ count }}>
      {/* this second component will share the mutations of the state */}
      <CountContextSetter.Provider value={{ increase, decrease }}>
        {children}
      </CountContextSetter.Provider>
    </CountContext.Provider>
  );
};

// Since we used the same provider we don't need to modify the  **App** component, but we do are **Wrapping** everything into one more **Provider**
const App = () => {
  return (
    <UserProvider>
      <CountProvider>
        {/* lets create two componets instead of one */}
        <ComponentSetter />
        <Component />
      </CountProvider>
    </UserProvider>
  );
};

const ComponentSetter = () => {
  const { increase, decrease } = useContext(CountContextSetter);

  return (
    <View>
      <Button title='Increase' onPress={increase} />
      <Button title='Decrease' onPress={decrease} />
    </View>
  );
};

const Component = () => {
  const { currentUser } = useContext(UserContext);

  // finally we are able to get access to the new context...
  const { count } = useContext(CountContext);

  return (
    <View>
      <Text>{currentUser.name}</Text>
      <Text>{count}</Text>
    </View>
  );
};
```

Wow, a lot!!! just to be able to separate the mutations... and have mutations!!

### it would be easier with the GlobalStore? Let's see.

```tsx
type TUser = {
  name: string;
  email: string;
};

const useUser = new GlobalStore<TUser>({
  name: null,
  email: null,
}).getHook();

// let's modify the store to add custom actions, the second parameter is configuration let's just pass null for now
const countStore = new GlobalStore(0, null, {
  increase() {
    return ({ setState }: StoreTools<number>) => {
      setState((state) => state + 1);
    };
  },

  decrease() {
    return ({ setState }: StoreTools<number>) => {
      setState((state) => state - 1);
    };
  },
} as const);

const useCount = countStore.getHook();

// this actions don't use hooks, but are connected to the store and all the subscribers will be notified
const [, countActions] = countStore.getHookDecoupled();

// this component is not subscribed to the store, so it will not be notified when the state changes
const ComponentSetter = () => {
  return (
    <View>
      <Button title='Increase' onPress={countActions.increase} />
      <Button title='Decrease' onPress={countActions.decrease} />
    </View>
  );
};

// this component is subscribed to the store, so it will be notified when the state changes
const Component = () => {
  const [user] = useUser();
  const [count, actions] = useCount();

  return (
    <View>
      <Text>{count}</Text>
    </View>
  );
};
```

### So let's analyze what happened

To restrict the state manipulations with the custom actions, we just need to add a third parameter to the store.

```ts
const countStore = new GlobalStore(0, null, {
  log: (action: string) => () => console.log(action),

  // every action is a function that returns a function that receives the store tools
  increase() {
    return ({ setState, getState }: StoreTools<number>): number => {
      setState((state) => state + 1);

      // actions are able to communicate between them
      this.log('increase');

      return getState();
    };
  },
} as const);

// the const is necessary to avoid typescript errors
```

All the library is strongly typed, we use generics to return the correct data type in each action.

```ts
const [, actions] = countStore.getHookDecoupled();

// for example the type of actions.increase will be: () => number
// just in case, even the parameters of the actions are gonna be exposed through TS
```

## getHookDecoupled

### **getHookDecoupled** returns a tuple with the state and the actions,

This is so useful when you want to use the actions without having to be subscribed to changes of the state.
There is also a third element in the tuple which is a function for getting the metadata of the store

### the metadata of the store is not reactive information which could be shared through the store

## Adding metadata to the store

```tsx
const [, , getMetadata] = new GlobalStore(0, {
  metadata: {
    isStoredSyncronized: false,
  },
}).getHookDecoupled();

console.log(getMetadata().isStoredSyncronized); // false
```

The setMetadata is part of the store tools, so it can be used in the actions, but againg the metadata is not reactive!! so it will not trigger a re-render on the subscribers

...

...

# That's it for now!! hope you enjoy coding!!
