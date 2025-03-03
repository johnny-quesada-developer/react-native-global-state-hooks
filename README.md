# react-native-global-state-hooks 🌟

![Image John Avatar](https://raw.githubusercontent.com/johnny-quesada-developer/global-hooks-example/main/public/avatar2.jpeg)

Effortless **global state management** for React & React Native! 🚀 Define a **global state in just one line of code** and enjoy **lightweight, flexible, and scalable** state management. Try it now on **[CodePen](https://codepen.io/johnnynabetes/pen/WNmeGwb?editors=0010)** and see it in action! ✨

---

## 🔗 Explore More

- **[Live Example](https://johnny-quesada-developer.github.io/react-global-state-hooks-example/)** 📘
- **[React Native Integration](https://www.npmjs.com/package/react-native-global-state-hooks/)** 📱
- **[Todo-List Example](https://github.com/johnny-quesada-developer/todo-list-with-global-hooks.git/)** 📝
- **[Video Overview](https://www.youtube.com/watch?v=1UBqXk2MH8I/)** 🎥
- **[GitHub Repository](https://github.com/johnny-quesada-developer/global-hooks-example/)** 🧩

Works seamlessly with **React & React Native**:

- **[react-global-state-hooks](https://www.npmjs.com/package/react-global-state-hooks)** for web applications.
- **[react-native-global-state-hooks](https://www.npmjs.com/package/react-native-global-state-hooks)** for React Native projects.

---

## 🗂️ Async Persist Storage

To persist the global state using **Async Storage**, simply add the `asyncStorage` option:

```ts
const useCount = createGlobalState(0, {
  asyncStorage: {
    key: "count",
  },
});
```

### 🔹 How It Works

✅ **Automatically syncs the state with Async Storage** if the value is serializable.
✅ **Provides an `isAsyncStorageReady` flag** to indicate when the async storage has been reviewed and committed.
✅ **Uses `@react-native-async-storage/async-storage` by default** (make sure to install this package if needed).
✅ **Allows custom async storage managers** with `asyncStorageWrapper.addAsyncStorageManager(customAsyncStorageManager)`;

Inside your components:

```tsx
const [count, setCount, { isAsyncStorageReady }] = useCount();
```

If you specify a key in `asyncStorage`, the state value persists automatically when serializable. When connecting to async storage, expect a **second render** that updates `isAsyncStorageReady`, indicating that the storage has been reviewed and the state is committed.

### 🔧 Custom Async Storage Manager

You can configure your own storage selection by using `asyncStorageWrapper.addAsyncStorageManager`. Ensure that the manager is **added before any hook is called**.

`index.ts`

```ts
import { asyncStorageWrapper } from "react-global-state-hooks";
asyncStorageWrapper.addAsyncStorageManager(customAsyncStorageManager);
```

## 🛠 Creating a Global State

Define a **global state** in **one line**:

```tsx
import { createGlobalState } from "react-hooks-global-states/createGlobalState";
export const useCount = createGlobalState(0);
```

Now, use it inside a component:

```tsx
const [count, setCount] = useCount();
return <Button onClick={() => setCount((count) => count + 1)}>{count}</Button>;
```

Works just like **useState**, but the **state is shared globally**! 🎉

---

## 🎯 Selectors: Subscribing to Specific State Changes

For **complex state objects**, you can subscribe to specific properties instead of the entire state:

```tsx
export const useContacts = createGlobalState({ entities: [], selected: new Set<number>() });
```

To access only the `entities` property:

```tsx
const [contacts] = useContacts((state) => state.entities);
return (
  <ul>
    {contacts.map((contact) => (
      <li key={contact.id}>{contact.name}</li>
    ))}
  </ul>
);
```

### 📌 Using Dependencies in Selectors

You can also add **dependencies** to a selector. This is useful when you want to derive state based on another piece of state (e.g., a filtered list). For example, if you're filtering contacts based on a `filter` value:

```tsx
const [contacts] = useContacts(
  (state) => state.entities.filter((item) => item.name.includes(filter)),
  [filter]
);
```

Alternatively, you can pass dependencies inside an **options object**:

```tsx
const [contacts] = useContacts((state) => state.entities.filter((item) => item.name.includes(filter)), {
  dependencies: [filter],
  isEqualRoot: (a, b) => a.entities === b.entities,
});
```

Unlike Redux, where only **root state changes trigger re-selection**, this approach ensures that **derived values recompute when dependencies change** while maintaining performance.

---

## 🔄 Reusing Selectors

### 📌 Creating a Selector

```tsx
export const useContactsArray = useContacts.createSelectorHook((state) => state.entities);
export const useContactsCount = useContactsArray.createSelectorHook((entities) => entities.length);
```

### 📌 Using Selectors in Components

```tsx
const [contacts] = useContactsArray();
const [count] = useContactsCount();
```

#### ✅ Selectors support inline selectors and dependencies

You can still **use dependencies** inside a selector hook:

```tsx
const [filteredContacts] = useContactsArray(
  (contacts) => contacts.filter((c) => c.name.includes(filter)),
  [filter]
);
```

#### ✅ Selector hooks share the same state mutator

The **stateMutator remains the same** across all derived selectors, meaning actions and setState functions stay consistent.

```tsx
const [actions1] = useContactsArray();
const [actions2] = useContactsCount();

console.log(actions1 === actions2); // true
```

---

## 🎛 State Actions: Controlling State Modifications

Restrict **state modifications** by defining custom actions:

```tsx
export const useContacts = createGlobalState(
  { filter: "", items: [] },
  {
    actions: {
      async fetch() {
        return async ({ setState }) => {
          const items = await fetchItems();
          setState({ items });
        };
      },
      setFilter(filter: string) {
        return ({ setState }) => {
          setState((state) => ({ ...state, filter }));
        };
      },
    },
  }
);
```

Now, instead of `setState`, the hook returns **actions**:

```tsx
const [filter, { setFilter }] = useContacts();
```

---

## 🌍 Accessing Global State Outside Components

Use `stateControls()` to **retrieve or update state outside React components**:

```tsx
const [contactsRetriever, contactsApi] = useContacts.stateControls();
console.log(contactsRetriever()); // Retrieves the current state
```

#### ✅ Subscribe to changes

```tsx
const unsubscribe = contactsRetriever((state) => {
  console.log("State updated:", state);
});
```

#### ✅ Subscriptions are great when one state depends on another.

```tsx
const useSelectedContact = createGlobalState(null, {
  callbacks: {
    onInit: ({ setState, getState }) => {
      contactsRetriever(
        (state) => state.contacts,
        (contacts) => {
          if (!contacts.has(getState())) setState(null);
        }
      );
    },
  },
});
```

---

## 🎭 Using Context for Scoped State

- **Scoped State** – Context state is **isolated inside the provider**.
- **Same API** – Context supports **selectors, actions, and state controls**.

### 📌 Creating a Context

```tsx
import { createContext } from "react-global-state-hooks/createContext";
export const [useCounterContext, CounterProvider] = createContext(0);
```

Wrap your app:

```tsx
<CounterProvider>
  <MyComponent />
</CounterProvider>
```

Use the context state:

```tsx
const [count] = useCounterContext();
```

### 📌 Context Selectors

Works **just like global state**, but within the provider.

---

## 🔥 Observables: Watching State Changes

Observables **let you react to state changes** via subscriptions.

### 📌 Creating an Observable

```tsx
export const useCounter = createGlobalState(0);
export const counterLogs = useCounter.createObservable((count) => `Counter is at ${count}`);
```

### 📌 Subscribing to an Observable

```tsx
const unsubscribe = counterLogs((message) => {
  console.log(message);
});
```

### 📌 Using Observables Inside Context

```tsx
export const [useStateControls, useObservableBuilder] = useCounterContext.stateControls();
const createObservable = useObservableBuilder();
useEffect(() => {
  const unsubscribe = createObservable((count) => {
    console.log(`Updated count: ${count}`);
  });
  return unsubscribe;
}, []);
```

---

## ⚖️ `createGlobalState` vs. `createContext`

| Feature                | `createGlobalState`                      | `createContext`                                                                                                    |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Scope**              | Available globally across the entire app | Scoped to the Provider where it’s used                                                                             |
| **How to Use**         | `const useCount = createGlobalState(0)`  | `const [useCountContext, Provider] = createContext(0)`                                                             |
| **createSelectorHook** | `useCount.createSelectorHook`            | `useCountContext.createSelectorHook`                                                                               |
| **inline selectors?**  | ✅ Supported                             | ✅ Supported                                                                                                       |
| **Custom Actions**     | ✅ Supported                             | ✅ Supported                                                                                                       |
| **Observables**        | `useCount.createObservable`              | `const [, useObservableBuilder] = useCountContext.stateControls()`                                                 |
| **State Controls**     | `useCount.stateControls()`               | `const [useStateControls] = useCountContext.stateControls()`                                                       |
| **Best For**           | Global app state (auth, settings, cache) | Scoped module state, reusable component state, or state shared between child components without being fully global |

## 🔄 Lifecycle Methods

Global state hooks support lifecycle callbacks for additional control.

```tsx
const useData = createGlobalState(
  { value: 1 },
  {
    callbacks: {
      onInit: ({ setState }) => {
        console.log("Store initialized");
      },
      onStateChanged: ({ state, previousState }) => {
        console.log("State changed:", previousState, "→", state);
      },
      computePreventStateChange: ({ state, previousState }) => {
        return state.value === previousState.value;
      },
    },
  }
);
```

Use **`onInit`** for setup, **`onStateChanged`** to listen to updates, and **`computePreventStateChange`** to prevent unnecessary updates.

## Metadata

There is a possibility to add non reactive information in the global state:

```tsx
const useCount = createGlobalState(0, { metadata: { renders: 0 } });
```

How to use it?

```tsx
const [count, , metadata] = useCount();

metadata.renders += 1;
```

## 🎯 Ready to Try It?

📦 **NPM Package:** [react-hooks-global-states](https://www.npmjs.com/package/react-hooks-global-states)

🚀 Simplify your **global state management** in React & React Native today! 🚀

# Using async persist storage

```ts
const useCount = createGlobalState(0, {
  asyncStorage: {
    key: "count",
  },
});
```

Inside your components

```tsx
const [count, setCount, { isAsyncStorageReady }] = useCount();
```

- if you specify a key into the `asyncStorage` this will persist the state value if the same is serializable
- when connecting to the async storage you can expect a second render which will update isAsyncStorageReady indicating that the async storage was already reviewed and the state value is committed.

The async storage default functionality depends on **@react-native-async-storage/async-storage** but this dependency is optional, install the package as a dependency if you want to enable persisted state.

optionally you can configure your own selection for persisting storage by using `asyncStorageWrapper.addAsyncStorageManager`, notice that the manager should be added before any hook gets call;
