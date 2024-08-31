# react-native-global-state-hooks 🌟

![Image John Avatar](https://raw.githubusercontent.com/johnny-quesada-developer/global-hooks-example/main/public/avatar2.jpeg)

Hi There! Welcome to **react-native-global-state-hooks** your New State Management Solution for React Native Components 🚀

Are you looking for a solution to manage **global state** in your **React Native components**? Look no further!

**react-native-global-state-hooks** is your option for efficiently handling global state management in your React Native applications.

One line of code for a **global state**! try it out now on [CODEPEN-react-global-state-hooks](https://codepen.io/johnnynabetes/pen/WNmeGwb?editors=0010) and witness the magic ✨.

For a deeper dive into how these hooks work, check out a comprehensive example at [react-global-state-hooks-example](https://johnny-quesada-developer.github.io/react-global-state-hooks-example/) 📘.

You can explore a **TODO-LIST** example using global state and asynchronous storage by heading to [todo-list-with-global-hooks](https://github.com/johnny-quesada-developer/todo-list-with-global-hooks.git) 📝.

For a more visual introduction, watch our informative video [here!](https://www.youtube.com/watch?v=1UBqXk2MH8I) 🎥 and dive into the code on [global-hooks-example](https://github.com/johnny-quesada-developer/global-hooks-example) 🧩.

The best part? [react-hooks-global-states](https://www.npmjs.com/package/react-hooks-global-states) is compatible with both **React** and **React Native**. If you're building web applications, explore this [react-global-state-hooks](https://www.npmjs.com/package/react-global-state-hooks), and for your React Native projects, here you are at **react-native-global-state-hooks**. These specialized libraries extend the capabilities of [react-hooks-global-states](https://www.npmjs.com/package/react-hooks-global-states) to perfectly fit your specific development environments. Discover the ease of global state management today! 🌐

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

# Using async persist storage

Just add a key for the async storage

```ts
const useCountPersisted = createGlobalState(1, {
  asyncStorage: {
    key: "count",
  },
});
```

After this the metadata of the hooks will now include a flag which will help you to determinate if the async storage was already reached.

```ts
const [count, setCount, { isAsyncStorageReady }] = useCountPersisted();
```

If no key is provided, the default metadata is null. Otherwise, it's set to **{ isAsyncStorageReady: false }**.

Upon the first successful retrieval from **AsyncStorage**, components will re-render with **{ isAsyncStorageReady: true }** in the metadata.
The metadata and components will be updated and re-rendered even if there's no difference between the value stored in **AsyncStorage** and the store's default value. This is the only instance where the metadata forces a re-render, after this the metadata will not update the component

# Selectors

What if you already have a global state that you want to subscribe to, but you don't want your component to listen to all the changes of the state, only a small portion of it? Let's create a more complex **state**

```ts
import { createGlobalState } from 'react-hooks-global-states';

export const useContacts = createGlobalState({
  isLoading: true,
  entities: Contact[],
  selected: Set<number>,
});
```

Now, let's say we have a situation where we want to access only the list of contacts. We don't care about the rest of the state.

```tsx
// That's it. With that simple selector, we now get the list of contacts,
// and the component will only re-render if the property **entities** changes on the global state
const [contacts] = useContacts((state) => state.entities]);

return (
  <ul>
    {contacts.map((contact) => (
      <li key={contact.id}>{contact.name}</li>
    ))}
  </ul>
);
```

What about special cases, like when you have a map instead of an array and want to extract a list of contacts? It's common to use selectors that return a new array, but this can cause React to re-render because the new array has a different reference than the previous one.

```tsx
export const useContacts = createGlobalState({
  isLoading: true,
  entities: Map<number, Contact>,
  selected: Set<number>,
});

// The selector is simply a standard selector used to extract the values from the map.

const [contacts] = useContacts((state) => [...state.entities.values()], {
  // The isEqualRoots function allows you to create your own validation logic for determining when to recompute the selector.
  isEqualRoot: (a, b) => a.entities === b.entities,
});
```

Okay, everything works when the changes come from the state, but what happens if I want to recompute the selector based on the internal state of the component?

**component.ts**

```tsx
const [filter, setFilter] = useState("");

const [contacts] = useContacts(
  (state) =>
    [...state.entities.values()].filter((item) => item.name.includes(filter)),
  {
    isEqualRoot: (a, b) => a.entities === b.entities,
    /**
     * Easy to understand, right? With the dependencies prop, you can,
     * just like with any other hook, provide a collection of values that will be compared during each render cycle
     * to determine if the selector should be recomputed.*/
    dependencies: [filter],
  }
);
```

And finally, what if you need to reuse this selector throughout your application and don't want to duplicate code?

```tsx
export const useContacts = createGlobalState({
  isLoading: true,
  entities: Map<number, Contact>,
  selected: Set<number>,
});

const useContactsArray = useContacts.createSelectorHook(
  (state) => [...state.entities.values()],
  {
    isEqualRoot: (a, b) => a.entities === b.entities,
  }
);
```

Now inside your component just call the new hook

**component.ts**

```tsx
const [filter, setFilter] = useState("");

const [contacts] = useContactsArray(
  (entities) => entities.name.includes(filter),
  {
    dependencies: [filter],
  }
);
```

Or you can create another selectorHook from your **useContactsArray**

```ts
const useContactsArray = useContacts.createSelectorHook(
  (state) => [...state.entities.values()],
  {
    isEqualRoot: (a, b) => a.entities === b.entities,
  }
);

const useContactsLength = useContactsArray.createSelectorHook(
  (entities) => entities.length
);
```

Or you can create a custom hook

```tsx
const useFilteredContacts = (filter: string) => {
  const [contacts] = useContactsArray(
    (entities) => entities.name.includes(filter),
    {
      dependencies: [filter],
    }
  );

  return contacts;
};
```

To summarize

```tsx
const [filter, setFilter] = useState("");

const [contacts] = useContacts(
  (state) => state.contacts.filter((contact) => contact.name.includes(filter)),
  {
    /**
     * You can use the `isEqualRoot` to validate if the values before the selector are equal.
     * This validation will run before `isEqual` and if the result is true the selector will not be recomputed.
     * If the result is true the re-render of the component will be prevented.
     */
    isEqualRoot: (r1, r2) => r1.filter === r2.filter,

    /**
     * You can use the `isEqual` to validate if the values after the selector are equal.
     * This validation will run after the selector computed a new value...
     * and if the result is true it will prevent the re-render of the component.
     */
    isEqual: (filter1, filter2) => filter1 === filter2,

    /**
     * You can use the `dependencies` array as with regular hooks to to force the recomputation of the selector.
     * Is important ot mention that changes in the dependencies will not trigger a re-render of the component...
     * Instead the recomputation of the selector will returned immediately.
     */
    dependencies: [filter],
  }
);

return (
  <ul>
    {contacts.map((contact) => (
      <li key={contact.id}>{contact.name}</li>
    ))}
  </ul>
);
```

Btw, If you want to perform a shallow comparison between the previous and new values, you can use the **shallowCompare** function from the library.

```TSX
({
  /**
  * You can use the `shallowCompare` from the GlobalStore.utils to compare the values at first level.
  */
  isEqual: shallowCompare,
})
```

Just remember, you can select or derive different values from the global state endlessly, but the state mutator will remain the same throughout the hooks.

More examples:

```ts
const useFilter = useContacts.createSelectorHook(({ filter }) => filter);

const useContactsArray = useContacts.createSelectorHook(({ items }) => items);

const useContactsLength = useContactsArray.createSelectorHook(
  (items) => items.length
);

const useIsContactsEmpty = useContactsLength.createSelectorHook(
  (length) => !length
);
```

It can't get any simpler, right? Everything is connected, everything is reactive. Plus, these hooks are strongly typed, so if you're working with **TypeScript**, you'll absolutely love it.

Each selector hook is reactive only to the fragment/derived of the state returned by the selector. And again you can optimize it by using the **isEqualRoot** and **isEqual** functions, which help avoid recomputing the selector if the root state or the fragment hasn't changed.

# State actions

Is common and often necessary to restrict the manipulation of state to a specific set of actions or operations. To achieve this, we can simplify the process by adding a custom API to the configuration of our **useContacts**.

By defining a custom API for the **useContacts**, we can encapsulate and expose only the necessary actions or operations that are allowed to modify the state. This provides a controlled interface for interacting with the state, ensuring that modifications stick to the desired restrictions.

```ts
import { createGlobalState } from "react-native-global-state-hooks";

const initialState = {
  isLoading: true,
  filter: "",
  items: [] as Contact[],
};

type State = typeof initialState;

export const useContacts = createGlobalState(initialState, {
  // this are the actions available for this state
  actions: {
    setFilter(filter: string) {
      return ({ setState }: StoreTools<State>) => {
        setState((state) => ({
          ...state,
          filter,
        }));
      };
    },
  } as const,
  onInit: async ({ setState }: StoreTools<State>) => {
    // fetch contacts
  },
});
```

That's it! In this updated version, the **useContacts** hook will no longer return [**state**, **stateMutator**] but instead will return [**state**, **actions**]. This change will provide a more intuitive and convenient way to access and interact with the state and its associated actions.

Let's see how that will look now into our **FilterBar.tsx**

```tsx
const [{ filter }, { setFilter }] = useFilter();

return <TextInput onChangeText={setFilter} />;
```

Yeah, that's it! All the **derived states** and **emitters** (we will talk about this later) will inherit the new actions interface.

You can even **derive** from another **derived state**! Let's explore a few silly examples:

```ts
const useFilter = createDerivate(useContacts, ({ filter }) => ({ filter }));

const useFilterString = createDerivate(useFilter, { filter } => filter);

const useContacts = createDerivate(useContacts, ({ items }) => items);

const useContactsLength = createDerivate(useContacts, (items) => items.length);

const useIsContactsEmpty = createDerivate(useContactsLength, (length) => !length);
```

It can't get any simpler, right? Everything is connected, everything is reactive. Plus, these hooks are strongly typed, so if you're working with **TypeScript**, you'll absolutely love it.

# State Controls

If you need to access the global state outside of a component or a hook without subscribing to state changes, or even inside a **ClassComponent**, you can use:

```tsx
useContacts.stateControls: () => [stateRetriever: StateGetter<State>, stateMutator: Setter<State>|ActionCollectionResult<State>, metadataRetriever: Metadata];

// example:
const [getContacts, setContacts] = useContacts.stateControls();

console.log(getContacts()); // prints the list of contacts
```

**stateMutator** is particularly useful when you want to create components that have editing access to a specific store but don't necessarily need to reactively respond to state changes.

Using the **stateRetriever** and the **stateMutator** allows you to retrieve the state when needed without establishing a reactive relationship with the state changes. This approach provides more flexibility and control over when and how components interact with the global state.

So, While **useContacts** will allow your components to subscribe to the custom hook, using the **contactsRetriever** method you will be able retrieve the current value of the state. This allows you to access the state whenever necessary, without being reactive to its changes and with the **contactsMutator** you now have the ability to modify the state without the need for subscription to the hook.

Additionally, to subscribe to state changes, you can pass a callback function as a parameter to the **stateRetriever**. This approach enables you to create a subscription group, allowing you to subscribe to either the entire state or a specific portion of it. When a callback function is provided to the **stateRetriever**, it will return a cleanup function instead of the state. This cleanup function can be used to unsubscribe or clean up the subscription when it is no longer needed.

```ts
/**
 * This not only allows you to retrieve the current value of the state...
 * but also enables you to subscribe to any changes in the state or a portion of it
 */
const removeSubscriptionGroup = contactsRetriever<Subscribe>((subscribe) => {
  subscribe((state) => {
    console.log("state changed: ", state);
  });

  subscribe(
    (state) => state.isLoading,
    (isLoading) => {
      console.log("is loading changed", isLoading);
    }
  );
});
```

That's great, isn't it? everything stays synchronized with the original state!!

## stateMutator

Let's add more actions to the state and explore how to use one action from inside another.

Here's an example of adding multiple actions to the state and utilizing one action within another:

```ts
import { createGlobalState } from "react-hooks-global-states";

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

# Stateful Context with Actions

**The ultimate blend of flexibility and control in React state management!** You can now create an isolated global state within a React context, giving each consumer of the context provider a unique state instance. But that’s not all...

**Stateful Context with Actions** extends the powerful features of global hooks into the realm of React Context. By integrating global hooks within a context, you bring all the benefits of global state management—such as modularity, selectors, derived states, and actions—into a context-specific environment. This means each consumer of the context not only gets a unique state instance but also inherits all the advanced capabilities of global hooks.

## Creating a Stateful Context

Forget about the boilerplate of creating a context... with **createStatefulContext** it's straightforward and powerful. You can create a context and provider with one line of code.

```tsx
export const [useCounterContext, CounterProvider] = createStatefulContext(2);
```

Then just wrap the components you need with the provider:

```tsx
<CounterProvider>
  <MyComponent />
</CounterProvider>
```

And finally, access the context value with the generated custom hook:

```tsx
const MyComponent = () => {
  const [useCounter] = useCounterContext();

  // If the component needs to react to state changes, simply use the hook
  const [count, setCount] = useCounter();

  return <>{count}</>;
};
```

What’s the advantage of this, you might ask? Well, now you have all the capabilities of the global hooks within the isolated scope of the context. For example, you can choose whether or not to listen to changes in the state:

```tsx
const MyComponent = () => {
  const [, , setCount] = useCounterContext();

  // This component can access only the stateMutator of the state,
  // and won't re-render if the counter changes
  return (
    <button onClick={() => setCount((count) => count + 1)}>Increase</button>
  );
};
```

Now you have selectors—if the state changes, the component will only re-render if the selected portion of the state changes.

```tsx
const MyComponent = () => {
  const [useCounter] = useCounterContext();

  // Notice that we can select and derive values from the state
  const [isEven, setCount] = useCounter((count) => count % 2 === 0);

  useEffect(() => {
    // Since the counter initially was 2 and now is 4, it’s still an even number.
    // Because of this, the component will not re-render.
    setCount(4);
  }, []);

  return <>{isEven ? "is even" : "is odd"}</>;
};
```

**createStatefulContext** also allows you to add custom actions to control the manipulation of the state.

```tsx
import { createStatefulContext, StoreTools } from "react-global-state-hooks";

type CounterState = {
  count: number;
};

const initialState: CounterState = {
  count: 0,
};

export const [useCounterContext, CounterProvider] = createStatefulContext(
  initialState,
  {
    actions: {
      increase: (value: number = 1) => {
        return ({ setState }: StoreTools<CounterState>) => {
          setState((state) => ({
            ...state,
            count: state.count + value,
          }));
        };
      },
      decrease: (value: number = 1) => {
        return ({ setState }: StoreTools<CounterState>) => {
          setState((state) => ({
            ...state,
            count: state.count - value,
          }));
        };
      },
    } as const,
  }
);
```

And just like with regular global hooks, now instead of a setState function, the hook will return the collection of actions:

```tsx
const MyComponent = () => {
  const [, , actions] = useCounterContext();

  return <button onClick={() => actions.increase(1)}>Increase</button>;
};
```

# Emitters

So, we have seen that we can subscribe a callback to state changes, create **selector hooks** from our global states. Guess what? We can also create derived **emitters** and subscribe callbacks to specific portions of the state. Let's review it:

```ts
const subscribeToFilter = createDerivateEmitter(
  contactsRetriever,
  ({ filter }) => ({
    filter,
  })
);
```

Cool, it's basically the same, but instead of using the **hook** as a parameter, we just have to use the **stateRetriever** as a parameter, and that will make the magic.

Now we are able to add a callback that will be executed every time the state of the **filter** changes.

```ts
const removeFilterSubscription = subscribeToFilter<Subscribe>(({ filter }) => {
  console.log(`The filter value changed: ${filter}`);
});
```

By default, the callback will be executed once subscribed, using the current value of the state. If you want to avoid this initial call, you can pass an extra parameter to the **subscribe** function.

```ts
const removeFilterSubscription = subscribeToFilter<Subscribe>(
  ({ filter }) => {
    console.log(`The filter value changed: ${filter}`);
  },
  {
    skipFirst: true,
  }
);
```

Also, of course, if you have an exceptional case where you want to derived/selected directly from the current **emitter**, you can add a **selector**. This allows you to fine-tune the emitted values based on your requirements

```ts
const removeFilterSubscription = subscribeToFilter<Subscribe>(
  ({ filter }) => filter,
  /**
   *  Cause of the selector the filter now is an string
   */
  (filter) => {
    console.log(`The filter value changed: ${filter}`);
  },
  {
    skipFirst: true,
    /**
     * You can also override the default shallow comparison...
     * or disable it completely by setting the isEqual callback to null.
     */
    isEqual: (a, b) => a === b,
    // isEqual: null // this will avoid doing a shallow comparison
  }
);
```

And guess what again? You can also derive emitters from derived emitters without any trouble at all! It works basically the same. Let's see an example:

```ts
const subscribeToItems = createDerivateEmitter(
  contactsRetriever,
  ({ items }) => items
);

const subscribeToItemsLength = createDerivateEmitter(
  subscribeToItems,
  (items) => items.length
);
```

The examples may seem a little silly, but they allow you to see the incredible things you can accomplish with these **derived states** and **emitters**. They open up a world of possibilities!

# Combining stateRetriever

What if you have two states and you want to combine them? You may have already guessed it right? ... you can create combined **emitters** and **hooks** from the hook **stateRetriever**.

By utilizing the approach of combining **emitters** and **hooks**, you can effectively merge multiple states and make them shareable. This allows for better organization and simplifies the management of the combined states. You don't need to refactor everything; you just need to combine the **global state hooks** you already have. Let's see a simple example:

First we are gonna create a couple of **global states**, and extract the **stateRetriever**.

```ts
const useHook1 = createGlobalState({
  propA: 1,
  propB: 2,
});

const [stateRetriever1, stateMutator1] = useHook1.stateControls();

const useHook2 = createGlobalState({
  propC: 3,
  propD: 4,
});

const [, stateRetriever2] = useHook2.stateControls();
```

Okay, cool, the first state as **propA, propB** while the second one has **propC, propD**, let's combine them:

```ts
const [useCombinedHook, combinedStateRetriever] = combineAsyncGetters(
  {
    selector: ([state1, state2]) => ({
      ...state1,
      ...state2,
    }),
  },
  stateRetriever1,
  stateRetriever2
);
```

Well, that's it! Now you have access to a **combinedStateRetriever** that will return the combined value of the two states. From this new **combinedStateRetriever**, you can retrieve the value or subscribe to its changes. Let'see:

```ts
const value = stateRetriever(); // { propA, propB, propC, propD }

// subscribe to the new emitter
const unsubscribeGroup = stateRetriever<Subscribe>((subscribe) => {
  subscribe((state) => {
    console.log(subscribe); // full state
  });

  // Please note that if you add a selector,
  // the callback will only trigger if the result of the selector changes.
  subscribe(
    ({ propA, propD }) => ({ propA, propD }),
    (derived) => {
      console.log(derived); // { propA, propD }
    }
  );
});
```

Regarding the newly created hook, **useCombinedHook**, you can seamlessly utilize it across all your components, just like your other **global state hooks**. This enables a consistent and familiar approach for accessing and managing the combined state within your application.

```ts
const [combinedState] = useCombinedHook();
```

The main difference with **combined hooks** compared to individual **global state hooks** is the absence of **metadata** and **actions**. Instead, combined hooks provide a condensed representation of the underlying global states using simple React functionality. This streamlined approach ensures lightweight usage, making it easy to access and manage the combined state within your components.

### Let's explore some additional examples.

Similar to your other **global state hooks**, **combined hooks** allow you to use **selectors** directly from consumer components. This capability eliminates the need to create an excessive number of reusable hooks if they are not truly necessary. By utilizing selectors, you can efficiently extract specific data from the **combined state** and utilize it within your components. This approach offers a more concise and focused way of accessing the required state values without the need for creating additional hooks unnecessarily.

```ts
const [fragment] = useCombinedHook(({ propA, propD }) => ({ propA, propD }));
```

Lastly, you have the flexibility to continue combining stateRetrievers if desired. This means you can extend the functionality of combined hooks by adding more stateRetrievers to merge additional states. By combining stateRetrievers in this way, you can create a comprehensive and unified representation of the combined states within your application. This approach allows for modular and scalable state management, enabling you to efficiently handle complex state compositions.

Let's see an example:

```ts
const [useCombinedHook, combinedStateRetriever1] = combineAsyncGetters(
  {
    selector: ([state1, state2]) => ({
      ...state1,
      ...state2,
    }),
  },
  stateRetriever1,
  stateRetriever2
);

const useHook3 = createGlobalState({
  propE: 1,
  propF: 2,
});

const [stateRetriever3, stateMutator3] = useHook3.stateControls();

const useIsLoading = createGlobalState(false);

const [isLoadingStateRetriever, isLoadingMutator] =
  useIsLoading.stateControls();
```

Once we created another peace of state, we can combine it with our other **global hooks** and **emitters**

```ts
const [useCombinedHook2, combinedStateRetriever2] = combineAsyncGetters(
  {
    selector: ([state1, state2, isLoading]) => ({
      ...state1,
      ...state2,
      isLoading,
    }),
  },
  combinedStateRetriever1,
  stateRetriever3,
  isLoadingStateRetriever
);
```

You have the freedom to combine as many global hooks as you wish. This means you can merge multiple states into a single cohesive unit by combining their respective hooks. This approach offers flexibility and scalability, allowing you to handle complex state compositions in a modular and efficient manner.

### **Quick note**:

Please be aware that the third parameter is a **dispose callback**, which can be particularly useful in **high-order** functions when you want to release any resources associated with the hook. By invoking the dispose callback, the hook will no longer report any changes, ensuring that resources are properly cleaned up. This allows for efficient resource management and can be beneficial in scenarios where you need to handle resource cleanup or termination in a controlled manner.

# Extending Global Hooks

## `[IMPORTANT!]`: From version 6.0.0, you can continue creating your custom implementations or using your previous ones. However, now AsyncStorage is already integrated into the global hooks with @react-native-async-storage/async-storage. You simply need to add a key for the persistent storage, and that will do the trick.

**`BUT!`** If you are against using **@react-native-async-storage/async-storage**, you can always use the base library [**react-hooks-global-state**](https://www.npmjs.com/package/react-hooks-global-states), which provides all the global hooks functionality without the persistent storage options. Take a look at the documentation—there's even an example of how to implement your own persistent storage in your own way.

```ts
// this is all you need fo using async storage
const useCountPersisted = createGlobalState(1, {
  asyncStorage: {
    key: "count",
  },
});

/**
 * Usage in your components:
 * [NOTE]: If no key is provided, the default metadata is null. Otherwise, it's set to { isAsyncStorageReady: false }.
 *
 * Upon the first successful retrieval from AsyncStorage, components will re-render with { isAsyncStorageReady: true } in the metadata.
 * The metadata and components will be updated and re-rendered even if there's no difference between the value stored in AsyncStorage and the store's default value. This is the only instance where the metadata forces a re-render, after this the metadata will not update the component
 */
const [count, setCount, { isAsyncStorageReady }] = useCountPersisted();
```

##### Now lets continue analyzing how to create a custom GlobalStore!

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
