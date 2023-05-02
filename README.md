# react-native-global-state-hooks

This is a package to easily handling **global state hooks** across your **react components**

For seen a running example of the hooks, you can check the following link: [react-global-state-hooks-example](https://johnny-quesada-developer.github.io/react-global-state-hooks-example/)

To see **TODO-LIST** with the hooks and **async storage** take a look here: [todo-list-with-global-hooks](https://github.com/johnny-quesada-developer/todo-list-with-global-hooks.git).

To see how to create a custom hook connected to your favorite async storage, please refer to the documentation section titled **Extending Global Hooks**

You can also see an introduction video [here!](https://www.youtube.com/watch?v=WfoMhO1zZ04&t=8s)

# Creating a global state

We are gonna create a global state hook **useCount** with one line of code.

```ts
import { createGlobalState } from "react-native-global-state-hooks";

export const useCount = createGlobalState(0);
```

That's it! Welcome to global hooks. Now, you can use this state wherever you need it in your application.

Let's see how to use it inside a simple **component**

```ts
const [count, setCount] = useCount();

return <Button onClick={() => setCount((count) => count + 1)}>{count}</Button>;
```

Isn't it cool? It works just like a regular **useState**. Notice the only difference is that now you don't need to provide the initial value since this is a global hook, and the initial value has already been provided.

# Selectors

What if you already have a global state that you want to subscribe to, but you don't want your component to listen to all the changes of the state, only a small portion of it? Let's create a more complex **state**

```ts
import { createGlobalState } from "react-native-global-state-hooks";

export const useContacts = createGlobalState({
  isLoading: true,
  filter: "",
  items: [] as Contact[],
});
```

Now, let's say I want to have a filter bar for the contacts that will only have access to the filter.

**FilterBar.tsx**

```ts
const [{ filter }, setState] = useContacts(({ filter }) => ({ filter }));

return (
  <TextInput onChangeText={() => setState((state) => ({ ...state, filter }))} />
);
```

# State actions

Is common and often necessary to restrict the manipulation of state to a specific set of actions or operations. To achieve this, we can simplify the process by adding a custom API to the configuration of our **useContacts**.

By defining a custom API for the **useContacts**, we can encapsulate and expose only the necessary actions or operations that are allowed to modify the state. This provides a controlled interface for interacting with the state, ensuring that modifications adhere to the desired restrictions.

```ts
import { createGlobalState } from "react-native-global-state-hooks";

export const useContacts = createGlobalState(
  {
    isLoading: true,
    filter: "",
    items: [] as Contact[],
  },
  {
    // this are the actions available for this state
    actions: {
      setFilter(filter: string) {
        return ({ setState }: StoreTools<number>) => {
          setState((state) => ({
            ...state,
            filter,
          }));
        };
      },
    } as const,
    onInit: async ({ setState }: StoreTools) => {
      // fetch contacts
    },
  }
);
```

That's it! In this updated version, the **useContacts** hook will no longer return [**state**, **stateSetter**] but instead will return [**state**, **actions**]. This change will provide a more intuitive and convenient way to access and interact with the state and its associated actions.

Let's see how that will look now into our **FilterBar.tsx**

```tsx
const [{ filter }, { setFilter }] = useContacts(({ filter }) => ({ filter }));

return <TextInput onChangeText={setFilter} />;
```

It can't get any simpler, right? Plus, these hooks are strongly typed, so if you're working with TypeScript, you'll love it.

Let's continue exploring which other features we can discover with global state hooks!!

# Decoupled state access

If you need to access the global state outside of a component or a hook without subscribing to state changes, or even inside a **ClassComponent**, you can use the **createGlobalStateWithDecoupledFuncs**.

Decoupled state access is particularly useful when you want to create components that have editing access to a specific store but don't necessarily need to reactively respond to state changes.

Using decoupled state access allows you to retrieve the state when needed without establishing a reactive relationship with the state changes. This approach provides more flexibility and control over when and how components interact with the global state. Let's see and example:

```ts
import { createGlobalStateWithDecoupledFuncs } from "react-native-global-state-hooks";

export const [useContacts, contactsGetter, contactsSetter] =
  createGlobalStateWithDecoupledFuncs({
    isLoading: true,
    filter: "",
    items: [] as Contact[],
  });
```

That's great! With the addition of the **contactsGetter** and **contactsSetter** methods, you now have the ability to access and modify the state without the need for subscription to the hook.

While **useContacts** will allow your components to subscribe to the custom hook, using the **contactsGetter** method you will be able retrieve the current value of the state. This allows you to access the state whenever necessary, without being reactive to its changes. Let' see how:

```ts
// To synchronously get the value of the state
const value = contactsGetter();

// the type of value will be { isLoading: boolean; filter: string; items: Contact[] }
```

Additionally, to subscribe to state changes, you can pass a callback function as a parameter to the **getter**. This approach enables you to create a subscription group, allowing you to subscribe to either the entire state or a specific portion of it. When a callback function is provided to the **getter**, it will return a cleanup function instead of the state. This cleanup function can be used to unsubscribe or clean up the subscription when it is no longer needed.

```ts
/**
 * This not only allows you to retrieve the current value of the state...
 * but also enables you to subscribe to any changes in the state or a portion of it
 */
const removeSubscriptionGroup = contactsGetter(
  ({ subscribe, subscribeSelector }) => {
    subscribe((state) => {
      console.log("state changed: ", state);
    });

    subscribeSelector(
      (state) => state.isLoading,
      (isLoading) => {
        console.log("is loading changed", isLoading);
      }
    );
  }
);
```

That's great, isn't it? And everything stays synchronized with the original state!!

...

Similarly, the **contactsSetter** method enables you to modify the state stored in **useContacts**. You can use this method to update the state with a new value or perform any necessary state mutations.

These additional methods provide a more flexible and granular way to interact with the state managed by **useContacts**. You can retrieve and modify the state as needed, without establishing a subscription relationship or reactivity with the state changes.

Let's add more actions to the state and explore how to use one action from inside another.

Here's an example of adding multiple actions to the state and utilizing one action within another:

```ts
import { createGlobalState } from "react-native-global-state-hooks";

export const useCount = createGlobalState(0, {
  actions: {
    log: (currentValue: string) => {
      return ({ getState }: StoreTools<number>): void => {
        console.log(`Current Value: ${getState()}`);
      };
    },

    increase(value: number = 1) {
      return ({ getState, setState, actions }: StoreTools<number>) => {
        setState((count) => count + value);

        actions.log(message);
      };
    },

    decrease(value: number = 1) {
      return ({ getState, setState, actions }: StoreTools<number>) => {
        setState((count) => count - value);

        actions.log(message);
      };
    },
  } as const,
});
```

Notice that the **StoreTools** will contain a reference to the generated actions API. From there, you'll be able to access all actions from inside another one... the **StoreTools** is generic and allow your to set an interface for getting the typing on the actions.

If you don't want to create an extra type please use **createGlobalStateWithDecoupledFuncs** in that way you'll be able to use the decoupled **actions** which will have the correct typing. Let's take a quick look into that:

```ts
import { createGlobalStateWithDecoupledFuncs } from "react-native-global-state-hooks";

export const [useCount, getCount, $actions] =
  createGlobalStateWithDecoupledFuncs(0, {
    actions: {
      log: (currentValue: string) => {
        return ({ getState }: StoreTools<number>): void => {
          console.log(`Current Value: ${getState()}`);
        };
      },

      increase(value: number = 1) {
        return ({ getState, setState }: StoreTools<number>) => {
          setState((count) => count + value);

          $actions.log(message);
        };
      },
    } as const,
  });
```

In the example the hook will work the same and you'll have access to the correct typing.

# Extending Global Hooks

Creating a global hook that connects to an asyncStorage is made incredibly easy with the **createCustomGlobalState** function.

This function returns a new global state builder wrapped with the desired custom implementation, allowing you to get creative! Le'ts see and example:

```ts
import { formatFromStore, formatToStore, createCustomGlobalState } = 'react-native-global-state-hooks'

// Optional configuration available for the consumers of the builder
type HookConfig = {
  asyncStorageKey?: string;
};

// This is the base metadata that all the stores created from the builder will have.
type BaseMetadata = {
  isAsyncStorageReady?: boolean;
};

export const createGlobalState = createCustomGlobalState<
  BaseMetadata,
  HookConfig
>({
  /**
   * This function executes immediately after the global state is created, before the invocations of the hook
   */
  onInitialize: async ({ setState, setMetadata }, config) => {
    setMetadata((metadata) => ({
      ...(metadata ?? {}),
      isAsyncStorageReady: null,
    }));

    const asyncStorageKey = config?.asyncStorageKey;
    if (!asyncStorageKey) return;

    const storedItem = (await asyncStorage.getItem(asyncStorageKey)) as string;

    // update the metadata, remember, metadata is not reactive
    setMetadata((metadata) => ({
      ...metadata,
      isAsyncStorageReady: true,
    }));

    if (storedItem === null) {
      return setState((state) => state, { forceUpdate: true });
    }

    const parsed = formatFromStore(storedItem, {
      jsonParse: true,
    });

    setState(parsed, { forceUpdate: true });
  },

  onChange: ({ getState }, config) => {
    if (!config?.asyncStorageKey) return;

    const state = getState();

    const formattedObject = formatToStore(state, {
      stringify: true,
    });

    asyncStorage.setItem(config.asyncStorageKey, formattedObject);
  },
});
```

It is important to use **forceUpdate** to force React to re-render our components and obtain the most recent state of the **metadata**. This is especially useful when working with primitive types, as it can be challenging to differentiate between a primitive value that originates from storage and one that does not.

It is worth mentioning that the **onInitialize** function will be executed only once per global state.

You can use to **formatToStore**, and **formatFromStore** to sanitize your data, These methods will help you transform objects into JSON strings and retrieve them back without losing any of the original data types. You will no longer encounter problems when **stringifying** Dates, Maps, Sets, and other complex data types. You could take a look in the API here: [json-storage-formatter](https://www.npmjs.com/package/json-storage-formatter).

Let's see how to create a global state using our new builder:

```ts
const useTodos = createGlobalState(new Map<string, number>(), {
  config: {
    asyncStorageKey: "todos",
  },
});
```

That's correct! If you add an **asyncStorageKey** to the state configuration, the state will be synchronized with the **asyncStorage**

Let's see how to use this async storage hook into our components:

```ts
const [todos, setTodos, metadata] = useTodos();

return (<>
  {metadata.isAsyncStorageReady ? <TodoList todos={todos} /> : <Text>Loading...</Text>}
<>);
```

The **metadata** is not reactive information and can only be modified from inside the global state lifecycle methods.

# Life cycle methods

There are some lifecycle methods available for use with global hooks, let's review them:

```ts
/**
* @description callback function called when the store is initialized
* @returns {void} result - void
* */
onInit?: ({
  /**
   * Set the metadata
   * @param {TMetadata} setter - The metadata or a function that will receive the metadata and return the new metadata
   * */
  setMetadata: MetadataSetter<TMetadata>;

  /**
   * Set the state
   * @param {TState} setter - The state or a function that will receive the state and return the new state
   * @param {{ forceUpdate?: boolean }} options - Options
   * */
  setState: StateSetter<TState>;

  /**
   * Get the state
   * @returns {TState} result - The state
   * */
  getState: () => TState;

  /**
   * Get the metadata
   * @returns {TMetadata} result - The metadata
   * */
  getMetadata: () => TMetadata;

  /**
   * Actions of the hook if configuration was provided
   */
  actions: TActions;
}: StateConfigCallbackParam<TState, TMetadata, TActions>) => void;

/**
* @description - callback function called every time the state is changed
*/
onStateChanged?: (parameters: StateChangesParam<TState, TMetadata, TActions>) => void;

/**
* callback function called every time a component is subscribed to the store
*/
onSubscribed?: (parameters: StateConfigCallbackParam<TState, TMetadata, TActions>) => void;

/**
* callback function called every time the state is about to change and it allows you to prevent the state change
*/
computePreventStateChange?: (parameters: StateChangesParam<TState, TMetadata, TActions>) => boolean;
```

You can pass this callbacks between on the second parameter of the builders like **createGlobalState**

```ts
const useData = createGlobalState(
  { value: 1 },
  {
    metadata: {
      someExtraInformation: "someExtraInformation",
    },
    // onSubscribed: (StateConfigCallbackParam) => {},
    // onInit // etc
    computePreventStateChange: ({ state, previousState }) => {
      const prevent = isEqual(state, previousState);

      return prevent;
    },
  }
);
```

Finally, if you have a very specific necessity but still want to use the global hooks, you can extend the **GlobalStoreAbstract** class. This will give you even more control over the state and the lifecycle of the global state.

Let's see an example again with the **asyncStorage** custom global hook but with the abstract class.

```ts
export class GlobalStore<
  TState,
  TMetadata extends {
    asyncStorageKey?: string;
    isAsyncStorageReady?: boolean;
  } | null = null,
  TStateSetter extends
    | ActionCollectionConfig<TState, TMetadata>
    | StateSetter<TState> = StateSetter<TState>
> extends GlobalStoreAbstract<TState, TMetadata, TStateSetter> {
  constructor(
    state: TState,
    config: GlobalStoreConfig<TState, TMetadata, TStateSetter> = {},
    actionsConfig: TStateSetter | null = null
  ) {
    super(state, config, actionsConfig);

    this.initialize();
  }

  protected onInitialize = async ({
    setState,
    setMetadata,
    getMetadata,
    getState,
  }: StateConfigCallbackParam<TState, TMetadata, TStateSetter>) => {
    setMetadata({
      ...(metadata ?? {}),
      isAsyncStorageReady: null,
    });

    const metadata = getMetadata();
    const asyncStorageKey = metadata?.asyncStorageKey;

    if (!asyncStorageKey) return;

    const storedItem = (await asyncStorage.getItem(asyncStorageKey)) as string;
    setMetadata({
      ...metadata,
      isAsyncStorageReady: true,
    });

    if (storedItem === null) {
      const state = getState();

      // force the re-render of the subscribed components even if the state is the same
      return setState(state, { forceUpdate: true });
    }

    const items = formatFromStore<TState>(storedItem, {
      jsonParse: true,
    });

    setState(items, { forceUpdate: true });
  };

  protected onChange = ({
    getMetadata,
    getState,
  }: StateChangesParam<TState, TMetadata, NonNullable<TStateSetter>>) => {
    const asyncStorageKey = getMetadata()?.asyncStorageKey;

    if (!asyncStorageKey) return;

    const state = getState();

    const formattedObject = formatToStore(state, {
      stringify: true,
    });

    asyncStorage.setItem(asyncStorageKey, formattedObject);
  };
}
```

Then, from an instance of the global store, you will be able to access the hooks.

```ts
const storage = new GlobalStore(0, {
  metadata: {
    asyncStorageKey: "counter",
    isAsyncStorageReady: false,
  },
});

const [getState, _, getMetadata] = storage.getHookDecoupled();
const useState = storage.getHook();
```

### **Note**: The GlobalStore class is still available in the package in case you were already extending from it.

# That's it for now!! hope you enjoy coding!!
