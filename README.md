# react-native-global-state-hooks 🌟

<div align="center">

![Johnny Quesada](https://raw.githubusercontent.com/johnny-quesada-developer/global-hooks-example/main/public/avatar2.jpeg)

</div>

<div align="center">

**Zero setup. Native persistence. Maximum performance.** 🚀

_The simplicity of `useState`, shared across your React Native app._ ✨

[![npm version](https://img.shields.io/npm/v/react-native-global-state-hooks.svg)](https://www.npmjs.com/package/react-native-global-state-hooks)
[![Downloads](https://img.shields.io/npm/dm/react-native-global-state-hooks.svg)](https://www.npmjs.com/package/react-native-global-state-hooks)
[![License](https://img.shields.io/npm/l/react-native-global-state-hooks.svg)](https://github.com/johnny-quesada-developer/react-native-global-state-hooks/blob/master/LICENSE)

[**NPM**](https://www.npmjs.com/package/react-native-global-state-hooks) • [**GitHub**](https://github.com/johnny-quesada-developer/react-native-global-state-hooks) • [**Core API Demo**](https://johnny-quesada-developer.github.io/global-hooks-example/) • [**Video Tutorial**](https://www.youtube.com/watch?v=1UBqXk2MH8I/)

</div>

---

## 🎯 The One-Liner

```tsx
import { createGlobalState } from "react-native-global-state-hooks";

export const useCounter = createGlobalState(0);
```

**That's it.** No providers. No Redux boilerplate. No configuration files. Just shared state with a familiar React API. 🎨

```tsx
import { Button } from "react-native";

function Counter() {
  const [count, setCount] = useCounter();

  return <Button title={`Count: ${count}`} onPress={() => setCount((current) => current + 1)} />;
}
```

---

## 🚀 Why Developers Love This Library

### 🎓 **Zero Learning Curve**

If you know `useState`, the basic API already feels familiar:

```tsx
// Local state
const [count, setCount] = useState(0);

// Global state
const [count, setCount] = useCounter();
```

### ⚡ **Surgical Re-renders**

Subscribe to only the part of the state your component needs.

```tsx
const [name] = useStore((state) => state.user.name);
```

The component only needs to react when its selected value changes.

### 🔗 **Chainable Selectors**

Build reusable state hooks from other selector hooks.

```tsx
const useUsers = useStore.createSelectorHook((state) => state.users);

const useAdmins = useUsers.createSelectorHook((users) => users.filter((user) => user.role === "admin"));
```

### 🎭 **Actions (Optional)**

Keep mutation logic close to the store when you want more structure.

```tsx
const useCounter = createGlobalState(0, {
  actions: {
    increment(amount = 1) {
      return ({ setState, getState }) => {
        setState(getState() + amount);
      };
    },
  },
});
```

### 🎪 **Context Mode**

Need isolated state instead of app-wide state? Use the same state model inside a Provider.

```tsx
const Form = createContext({
  name: "",
  email: "",
});

<Form.Provider>
  <FormFields />
</Form.Provider>;
```

### 📱 **Native Async Persistence**

Persist state with React Native async storage semantics.

```tsx
const useSettings = createGlobalState(
  { theme: "dark" as "dark" | "light" },
  {
    asyncStorage: {
      key: "settings",
      validator: ({ restored, initial }) => {
        if (!validateStateIntegrity(restored)) return initial;
        return restored;
      },
    },
  },
);
```

### 📦 **Non-Reactive API**

Read, update, or subscribe to state outside React components.

```tsx
const currentUser = useAuth.getState().user;

useAuth.setState((state) => ({
  ...state,
  user: nextUser,
}));
```

---

## 📦 Installation

```bash
npm install react-native-global-state-hooks
```

or

```bash
yarn add react-native-global-state-hooks
```

### 💾 Persisted State

The core state library does **not** require AsyncStorage.

But if you want the built-in React Native persistence backend, also install:

```bash
npm install @react-native-async-storage/async-storage
```

or

```bash
yarn add @react-native-async-storage/async-storage
```

`@react-native-async-storage/async-storage` is an **optional peer dependency**. You can also provide your own async storage manager or a per-store persistence adapter.

---

## 🎬 Quick Start

### 30 Seconds to Global State

```tsx
import { Button, Text, View } from "react-native";
import { createGlobalState } from "react-native-global-state-hooks";

const useTheme = createGlobalState("dark" as "light" | "dark");

function ThemeToggle() {
  const [theme, setTheme] = useTheme();

  return (
    <View>
      <Text>{theme} mode</Text>

      <Button
        title="Toggle theme"
        onPress={() => {
          setTheme((current) => (current === "dark" ? "light" : "dark"));
        }}
      />
    </View>
  );
}
```

### 60 Seconds to Production-Ready

A persisted React Native store initializes **asynchronously**, so the hook also exposes storage readiness through metadata.

```tsx
import { ActivityIndicator, Switch, Text, View } from "react-native";
import { createGlobalState } from "react-native-global-state-hooks";

type Settings = {
  darkMode: boolean;
  haptics: boolean;
};

const initialSettings: Settings = {
  darkMode: true,
  haptics: true,
};

const useSettings = createGlobalState(initialSettings, {
  asyncStorage: {
    key: "app-settings",

    validator: ({ restored, initial }) => {
      if (!validateStateIntegrity(restored)) return initial; // you could also throw an exception and the store will use the initial state
      return settings as Settings;
    },
  },

  actions: {
    setDarkMode(enabled: boolean) {
      return ({ setState }) => {
        setState((state) => ({
          ...state,
          darkMode: enabled,
        }));
      };
    },

    setHaptics(enabled: boolean) {
      return ({ setState }) => {
        setState((state) => ({
          ...state,
          haptics: enabled,
        }));
      };
    },
  },
});

function SettingsScreen() {
  const [settings, actions, { isAsyncStorageReady }] = useSettings();

  if (!isAsyncStorageReady) {
    return <ActivityIndicator />;
  }

  return (
    <View>
      <Text>Dark mode</Text>
      <Switch value={settings.darkMode} onValueChange={actions.setDarkMode} />

      <Text>Haptics</Text>
      <Switch value={settings.haptics} onValueChange={actions.setHaptics} />
    </View>
  );
}
```

Now you have:

- ✅ Global React Native state
- ✅ Fine-grained selectors
- ✅ Type-safe actions
- ✅ Async persistence
- ✅ Restore readiness
- ✅ Validation and error handling

---

## 🌟 Core Features Deep Dive

### 1️⃣ Global State with `createGlobalState`

Create state that lives outside the component tree and can be consumed anywhere in your React Native app.

#### 🎨 The Basics

```tsx
import { createGlobalState } from "react-native-global-state-hooks";

// Primitives
const useCount = createGlobalState(0);
const useTheme = createGlobalState("light" as "light" | "dark");
const useIsOnline = createGlobalState(true);

// Objects
const useUser = createGlobalState({
  name: "Guest",
  role: "viewer",
});

// Arrays
const useTodos = createGlobalState([
  { id: 1, text: "Learn the library", done: true },
  { id: 2, text: "Build something", done: false },
]);
```

#### 🎯 Surgical Re-renders with Selectors

```tsx
const useStore = createGlobalState({
  user: {
    name: "Johnny",
    email: "johnny@example.com",
  },
  theme: "dark",
  notifications: [],
  settings: {
    sound: true,
    haptics: true,
  },
});

function UserName() {
  const [name] = useStore((state) => state.user.name);

  return <Text>{name}</Text>;
}

function ThemeLabel() {
  const theme = useStore.select((state) => state.theme);

  return <Text>{theme}</Text>;
}

function NotificationCount() {
  const [notifications] = useStore((state) => state.notifications);

  return <Text>{notifications.length}</Text>;
}
```

Each component subscribes to the value it actually uses instead of blindly reacting to the whole state object.

#### ⚡ Computed Values with Dependencies

Selectors can also depend on component-local values.

```tsx
const useTodos = createGlobalState({
  todos: [
    { id: 1, text: "Task 1", completed: false, priority: "high" },
    { id: 2, text: "Task 2", completed: true, priority: "low" },
    { id: 3, text: "Task 3", completed: false, priority: "high" },
  ],
});

function TodoList() {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const [todos] = useTodos(
    (state) => {
      if (filter === "active") {
        return state.todos.filter((todo) => !todo.completed);
      }

      if (filter === "completed") {
        return state.todos.filter((todo) => todo.completed);
      }

      return state.todos;
    },
    [filter],
  );

  return (
    <View>
      {todos.map((todo) => (
        <Text key={todo.id}>{todo.text}</Text>
      ))}
    </View>
  );
}
```

For more control, pass an options object:

```tsx
const [todos] = useTodos(
  (state) =>
    state.todos.filter((todo) => (filter === "all" ? true : todo.completed === (filter === "completed"))),
  {
    dependencies: [filter],
    isEqualRoot: (previous, next) => previous.todos === next.todos,
  },
);
```

#### 🔗 Reusable Selector Hooks

Create hooks from hooks and compose them.

```tsx
const useStore = createGlobalState({
  users: [
    { id: 1, name: "Alice", role: "admin", active: true },
    { id: 2, name: "Bob", role: "user", active: true },
    { id: 3, name: "Charlie", role: "admin", active: false },
  ],
});

const useUsers = useStore.createSelectorHook((state) => state.users);

const useActiveUsers = useUsers.createSelectorHook((users) => users.filter((user) => user.active));

const useActiveAdmins = useActiveUsers.createSelectorHook((users) =>
  users.filter((user) => user.role === "admin"),
);

function UserStats() {
  const [users] = useUsers();
  const [activeUsers] = useActiveUsers();
  const [activeAdmins] = useActiveAdmins();

  return (
    <View>
      <Text>Total: {users.length}</Text>
      <Text>Active: {activeUsers.length}</Text>
      <Text>Active admins: {activeAdmins.length}</Text>
    </View>
  );
}
```

#### 🎬 Actions — When You Need Structure

Actions are optional. Add them when you want a defined mutation API.

```tsx
type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

const useTodos = createGlobalState(
  {
    todos: [] as Todo[],
    filter: "all" as "all" | "active" | "completed",
  },
  {
    actions: {
      addTodo(text: string) {
        return ({ setState }) => {
          const todo: Todo = {
            id: `${Date.now()}`,
            text,
            completed: false,
          };

          setState((state) => ({
            ...state,
            todos: [...state.todos, todo],
          }));
        };
      },

      toggleTodo(id: string) {
        return ({ setState }) => {
          setState((state) => ({
            ...state,
            todos: state.todos.map((todo) =>
              todo.id === id ? { ...todo, completed: !todo.completed } : todo,
            ),
          }));
        };
      },

      setFilter(filter: "all" | "active" | "completed") {
        return ({ setState }) => {
          setState((state) => ({
            ...state,
            filter,
          }));
        };
      },
    },
  },
);

function TodoActions() {
  const [, actions] = useTodos();

  return <Button title="Add todo" onPress={() => actions.addTodo("New task")} />;
}
```

#### 🔌 Non-Reactive API — Use Outside React

The store hook also exposes its API directly.

```tsx
const useAuth = createGlobalState({
  user: null as null | { id: string; name: string },
  token: null as string | null,
});
```

Read state outside a component:

```tsx
const auth = useAuth.getState();
```

Update it:

```tsx
useAuth.setState((state) => ({
  ...state,
  user: {
    id: "42",
    name: "Johnny",
  },
}));
```

Subscribe to a state fragment:

```tsx
const unsubscribe = useAuth.subscribe(
  (state) => state.user,
  (user) => {
    console.log("User changed:", user);
  },
);

// Later
unsubscribe();
```

This is useful for networking layers, app lifecycle handlers, push-notification handlers, analytics, and other code that does not render UI.

#### 🔭 Observable Fragments

Create observable slices of state for reactive workflows outside components.

```tsx
const useStore = createGlobalState({
  count: 0,
  user: {
    name: "Johnny",
  },
});

const countObservable = useStore.createObservable((state) => state.count);

countObservable.subscribe((count) => {
  console.log("Count:", count);
});

console.log(countObservable.getState());

const doubledObservable = countObservable.createObservable((count) => count * 2);
```

#### 📋 Metadata — Non-Reactive Side Information

Metadata is useful for information that belongs to the store but should not independently trigger component updates.

```tsx
const useFeed = createGlobalState(
  { items: [] as string[] },
  {
    metadata: {
      isLoading: false,
      lastFetch: null as Date | null,
      error: null as Error | null,
    },
  },
);
```

Read or update it through the store API:

```tsx
useFeed.setMetadata((metadata) => ({
  ...metadata,
  isLoading: true,
}));

const metadata = useFeed.getMetadata();

console.log(metadata.isLoading);
```

Persisted Native stores extend metadata with:

```tsx
const [, , { isAsyncStorageReady, asyncStorageKey }] = useSettings();
```

`isAsyncStorageReady` is specifically about the asynchronous persistence initialization lifecycle. Arbitrary metadata remains non-reactive.

---

### 💾 Persisted State with Async Storage

This is the major platform-specific feature of `react-native-global-state-hooks`.

Unlike browser `localStorage`, React Native persistence is **asynchronous**. A persisted store starts with its initial state, checks storage asynchronously, validates or migrates the restored value, and then marks the persistence initialization as ready.

#### 🎨 Basic Persistence

```tsx
import { createGlobalState } from "react-native-global-state-hooks";

type Settings = {
  theme: "light" | "dark";
  language: string;
};

const initialSettings: Settings = {
  theme: "dark",
  language: "en",
};

const useSettings = createGlobalState(initialSettings, {
  asyncStorage: {
    key: "app-settings",

    validator: ({ restored, initial }) => {
      if (!restored || typeof restored !== "object") {
        return initial;
      }

      const value = restored as Partial<Settings>;

      if ((value.theme !== "light" && value.theme !== "dark") || typeof value.language !== "string") {
        return initial;
      }

      return value as Settings;
    },
  },
});
```

The built-in persistence flow:

- ✅ Restores the value asynchronously
- ✅ Persists state changes asynchronously
- ✅ Tracks restore readiness in store metadata
- ✅ Validates restored state
- ✅ Supports schema versioning and migration
- ✅ Supports custom error handling
- ✅ Uses a configurable async storage backend

#### ⏳ Async Restore & `isAsyncStorageReady`

Because storage access is asynchronous, the initial state can be available before persisted state has finished loading.

```tsx
function AppSettings() {
  const [settings, , { isAsyncStorageReady }] = useSettings();

  if (!isAsyncStorageReady) {
    return <ActivityIndicator />;
  }

  return <Text>Theme: {settings.theme}</Text>;
}
```

`isAsyncStorageReady` starts as `false` for a persisted store and becomes `true` after the storage initialization flow has completed.

That initialization can:

1. Read the stored value
2. Migrate it when necessary
3. Validate the result
4. Update the store
5. Persist the normalized value
6. Mark Async Storage as ready

This is fundamentally different from synchronous browser `localStorage`.

#### 🔒 Validation

The current Native persistence configuration includes a `validator`.

```tsx
const useProfile = createGlobalState(initialProfile, {
  asyncStorage: {
    key: "profile",

    validator: ({ restored, initial }) => {
      if (!isProfile(restored)) {
        return initial;
      }

      return restored;
    },
  },
});
```

The validator receives:

- **`restored`** — the value loaded from persistence
- **`initial`** — the store's current initial value

Return behavior:

- Return a value → that value becomes the restored state
- Return `initial` → reject the persisted value and fall back
- Return `undefined` → accept the restored value as-is

The validator also runs after migration.

#### 🔄 Versioning & Migration

Persisted schemas evolve. Native persistence can migrate old values before committing them to the current store.

```tsx
type Preferences = {
  theme: "light" | "dark";
  notifications: boolean;
};

const initialPreferences: Preferences = {
  theme: "dark",
  notifications: true,
};

const usePreferences = createGlobalState(initialPreferences, {
  asyncStorage: {
    key: "preferences",

    versioning: {
      version: 2,

      migrator: ({ legacy, initial }) => {
        if (legacy && typeof legacy === "object" && "theme" in legacy) {
          return {
            ...initial,
            theme: legacy.theme === "light" ? "light" : "dark",
          };
        }

        return initial;
      },
    },

    validator: ({ restored, initial }) => {
      if (!restored || typeof restored !== "object") {
        return initial;
      }

      return restored as Preferences;
    },
  },
});
```

With the built-in persistence path:

1. The stored item carries its schema version
2. A version mismatch can invoke `migrator`
3. The migrated result goes through `validator`
4. The normalized state is committed and persisted

#### 🚨 Persistence Errors

Handle storage, serialization, validation, or migration failures without mixing them into your UI state.

```tsx
const useSettings = createGlobalState(initialSettings, {
  asyncStorage: {
    key: "settings",

    validator: ({ restored, initial }) => {
      return isSettings(restored) ? restored : initial;
    },

    onError(error) {
      reportError(error);
    },
  },
});
```

If `onError` is omitted, the library reports persistence failures to `console.error`.

#### 🔧 Custom Async Storage Manager

By default, the library attempts to use:

```text
@react-native-async-storage/async-storage
```

That package is optional. You can replace the low-level storage manager globally.

A manager works with **strings**, just like AsyncStorage:

```tsx
import { asyncStorageWrapper, type AsyncStorageManager } from "react-native-global-state-hooks";

const customStorage: AsyncStorageManager = {
  async getItem(key) {
    return myStorage.getString(key);
  },

  async setItem(key, value) {
    await myStorage.setString(key, value);
  },
};

await asyncStorageWrapper.addAsyncStorageManager(async () => {
  return customStorage;
});
```

Configure the manager before persisted stores need to initialize.

The library still owns formatting, restoration, validation, and version envelopes when you use this low-level manager.

#### 🧩 Per-Store Persistence Adapter

Need one store to use a completely different persistence mechanism? Use `adapter`.

Unlike the global storage manager, an adapter works with the actual **State value**, not serialized strings.

```tsx
const useSettings = createGlobalState(initialSettings, {
  asyncStorage: {
    key: "settings",

    validator: ({ restored, initial }) => {
      return isSettings(restored) ? restored : initial;
    },

    adapter: {
      async getItem(key) {
        return settingsDatabase.get(key);
      },

      async setItem(key, value) {
        await settingsDatabase.set(key, value);
      },
    },
  },
});
```

When an adapter is provided:

- ✅ The adapter controls storage for that store
- ✅ `getItem()` and `setItem()` work with the store's state value
- ✅ Validation still applies
- ❌ Built-in versioning/migration is bypassed
- ❌ Built-in string serialization is bypassed

Use the global manager when you want to replace the AsyncStorage-compatible backend for the app.

Use an adapter when a specific store needs custom persistence behavior.

> **Native difference:** the Native `asyncStorage` configuration does not expose the web package's `selector` option for selective persistence. If only part of a state should be persisted, split that persisted data into its own store or implement the desired behavior through an adapter.

---

### 2️⃣ Scoped State with `createContext`

Sometimes state should belong to one subtree rather than the entire application.

#### 🎪 The Basics

```tsx
import { TextInput, View } from "react-native";
import { createContext } from "react-native-global-state-hooks";

const UserForm = createContext({
  name: "",
  email: "",
});

function App() {
  return (
    <UserForm.Provider>
      <FormFields />
    </UserForm.Provider>
  );
}

function FormFields() {
  const [form, setForm] = UserForm.use();

  return (
    <View>
      <TextInput
        value={form.name}
        onChangeText={(name) => {
          setForm((state) => ({
            ...state,
            name,
          }));
        }}
      />

      <TextInput
        value={form.email}
        onChangeText={(email) => {
          setForm((state) => ({
            ...state,
            email,
          }));
        }}
      />
    </View>
  );
}
```

#### 🎁 Provider Variations

Use the default value:

```tsx
<Theme.Provider>
  <Screen />
</Theme.Provider>
```

Provide a value for one subtree:

```tsx
<Theme.Provider value="dark">
  <Screen />
</Theme.Provider>
```

Or derive a value from the context's initial value:

```tsx
<Theme.Provider value={(initial) => (initial === "dark" ? "light" : "dark")}>
  <Screen />
</Theme.Provider>
```

#### 🎯 Context + Selectors = ❤️

```tsx
const Profile = createContext({
  user: {
    name: "",
    email: "",
  },
  settings: {
    darkMode: false,
  },
});

function UserName() {
  const [name] = Profile.use((state) => state.user.name);

  return <Text>{name}</Text>;
}
```

#### 🎭 Context with Actions

```tsx
const Counter = createContext(0, {
  actions: {
    increment(amount = 1) {
      return ({ setState, getState }) => {
        setState(getState() + amount);
      };
    },

    reset() {
      return ({ setState }) => {
        setState(0);
      };
    },
  },
});

function CounterScreen() {
  const [count, actions] = Counter.use();

  return (
    <View>
      <Text>{count}</Text>

      <Button title="+1" onPress={() => actions.increment()} />

      <Button title="Reset" onPress={actions.reset} />
    </View>
  );
}
```

#### 🔗 Reusable Context Selectors

```tsx
const Data = createContext({
  users: [] as Array<{
    id: string;
    name: string;
    active: boolean;
  }>,
});

const useUsers = Data.use.createSelectorHook((state) => state.users);

const useActiveUsers = useUsers.createSelectorHook((users) => users.filter((user) => user.active));

function ActiveUsers() {
  const [users] = useActiveUsers();

  return (
    <View>
      {users.map((user) => (
        <Text key={user.id}>{user.name}</Text>
      ))}
    </View>
  );
}
```

#### 🧪 Testing Context Stores

The Provider can expose its store tools through a wrapper helper.

```tsx
const { wrapper, context } = Counter.Provider.makeProviderWrapper();

// Use `wrapper` with your hook/component test renderer.

// Direct access to the context API:
context.current.actions.increment();

console.log(context.current.getState());
```

#### 🎬 Lifecycle Hooks

Context stores can react to Provider creation, mount, and cleanup.

```tsx
const Session = createContext(
  {
    user: null,
  },
  {
    callbacks: {
      onCreated(api) {
        console.log("Context created:", api.getState());
      },

      onMounted(api) {
        const unsubscribe = sessionEvents.subscribe((user) => {
          api.setState({ user });
        });

        return unsubscribe;
      },
    },
  },
);
```

---

## 🔥 Advanced Patterns

### 🏗️ Production Architecture

A larger application can keep each domain store self-contained.

```text
src/stores/todos/
  ├── index.ts
  ├── todos$.ts
  ├── constants/
  │   └── initialValue.ts
  ├── types/
  │   └── Todo.ts
  ├── hooks/
  │   ├── useActiveTodos.ts
  │   └── useCompletedTodos.ts
  └── helpers/
      └── createTodo.ts
```

**`todos$.ts`**

```tsx
import { createGlobalState } from "react-native-global-state-hooks";
import { initialValue } from "./constants/initialValue";

const todos$ = createGlobalState(initialValue, {
  asyncStorage: {
    key: "todos",

    validator: ({ restored, initial }) => {
      return isTodosState(restored) ? restored : initial;
    },
  },

  actions: {
    addTodo(text: string) {
      return ({ setState }) => {
        setState((state) => ({
          ...state,
          todos: [
            ...state.todos,
            {
              id: `${Date.now()}`,
              text,
              completed: false,
            },
          ],
        }));
      };
    },

    toggleTodo(id: string) {
      return ({ setState }) => {
        setState((state) => ({
          ...state,
          todos: state.todos.map((todo) =>
            todo.id === id
              ? {
                  ...todo,
                  completed: !todo.completed,
                }
              : todo,
          ),
        }));
      };
    },
  },
});

export default todos$;
```

**`hooks/useActiveTodos.ts`**

```tsx
import todos$ from "../todos$";

export const useActiveTodos = todos$.createSelectorHook((state) =>
  state.todos.filter((todo) => !todo.completed),
);
```

**`index.ts`**

```tsx
import todos$ from "./todos$";
import { useActiveTodos } from "./hooks/useActiveTodos";
import { useCompletedTodos } from "./hooks/useCompletedTodos";

export default Object.assign(todos$, {
  useActiveTodos,
  useCompletedTodos,
}); // groups everything into a single name space
```

Usage:

```tsx
import todos$ from "./todos";

function TodoList() {
  const activeTodos = todos$.useActiveTodos();

  return (
    <View>
      {activeTodos.map((todo) => (
        <Text key={todo.id}>{todo.text}</Text>
      ))}
    </View>
  );
}
```

### 🎧 Smart Subscriptions

Subscribe to only the fragment an integration needs.

```tsx
const useSession = createGlobalState({
  user: null as null | { id: string; role: string },
  isOnline: true,
});

const unsubscribeRole = useSession.subscribe(
  (state) => state.user?.role,
  (role) => {
    analytics.track("role_changed", {
      role,
    });
  },
);

const unsubscribeConnection = useSession.subscribe(
  (state) => state.isOnline,
  (isOnline) => {
    syncEngine.setOnline(isOnline);
  },
);

// Cleanup
unsubscribeRole();
unsubscribeConnection();
```

### 📲 App Lifecycle Integration

The non-reactive API is useful when React Native lifecycle events happen outside a screen.

```tsx
import { AppState } from "react-native";

const useAppStatus = createGlobalState({
  active: true,
});

const subscription = AppState.addEventListener("change", (status) => {
  useAppStatus.setState({
    active: status === "active",
  });
});

// Later
subscription.remove();
```

---

## 🎨 `uniqueId` — Type-Safe Unique IDs

`react-native-global-state-hooks` also exports `uniqueId`.

### 🏷️ Basic Usage

```tsx
import { uniqueId } from "react-native-global-state-hooks";

const id = uniqueId();

console.log(id);
```

Add a prefix:

```tsx
const userId = uniqueId("user:");
const todoId = uniqueId("todo:");
```

### 🔒 Branded IDs

Create identifiers that TypeScript treats as different domains.

```tsx
import { uniqueId } from "react-native-global-state-hooks";

const userId = uniqueId.for("user:");
const todoId = uniqueId.for("todo:");

type UserId = ReturnType<typeof userId>;
type TodoId = ReturnType<typeof todoId>;
```

Now accidentally mixing identifiers becomes a type error:

```tsx
function openUser(id: UserId) {
  // ...
}

openUser(userId); // ✅
openUser(todoId); // ❌ TypeScript error
```

### 💼 Real-World Example

```tsx
type User = {
  id: UserId;
  name: string;
};

type Todo = {
  id: TodoId;
  text: string;
  assignedTo: UserId | null;
};

const useApp = createGlobalState({
  users: [] as User[],
  todos: [] as Todo[],
});
```

---

## 🎓 Learning Resources

| Resource                                                                                                | Description                                          |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 📦 [**NPM Package**](https://www.npmjs.com/package/react-native-global-state-hooks)                     | Published React Native package                       |
| 💻 [**GitHub Repository**](https://github.com/johnny-quesada-developer/react-native-global-state-hooks) | Source, tests, and issues                            |
| 🎮 [**Core API Demo**](https://johnny-quesada-developer.github.io/global-hooks-example/)                | Browser demo of the shared state-management concepts |
| 🎥 [**Video Tutorial**](https://www.youtube.com/watch?v=1UBqXk2MH8I/)                                   | State-management walkthrough                         |
| 📚 [**Core Package**](https://www.npmjs.com/package/react-hooks-global-states)                          | Shared state engine used by the platform packages    |

---

## 🌐 Platform-Specific Versions

| Package                                                                                            | Platform                 | Persistence                                          |
| -------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------- |
| [`react-hooks-global-states`](https://www.npmjs.com/package/react-hooks-global-states)             | Core React state library | No platform-specific persistence layer               |
| [`react-global-state-hooks`](https://www.npmjs.com/package/react-global-state-hooks)               | Web                      | `localStorage` integration                           |
| [`react-native-global-state-hooks`](https://www.npmjs.com/package/react-native-global-state-hooks) | React Native             | Async persistence with optional AsyncStorage backend |

The state-management concepts are intentionally similar across the packages, but their persistence models are **not interchangeable**.

---

## 🎉 Why Developers Choose This

### The Bottom Line

| What You Get                        | What You Avoid                     |
| ----------------------------------- | ---------------------------------- |
| ✅ `useState`-like API              | ❌ Redux-style boilerplate         |
| ✅ Surgical selectors               | ❌ Whole-store re-renders          |
| ✅ Chainable selector hooks         | ❌ Repeated selector logic         |
| ✅ Optional actions                 | ❌ Forced architecture             |
| ✅ Global + scoped context state    | ❌ Choosing only one model         |
| ✅ Non-reactive store API           | ❌ React-only access               |
| ✅ Async native persistence         | ❌ Hand-written restore plumbing   |
| ✅ `isAsyncStorageReady`            | ❌ Guessing when restore completed |
| ✅ Validation + migration           | ❌ Fragile persisted schemas       |
| ✅ Custom storage manager / adapter | ❌ One forced persistence backend  |
| ✅ TypeScript inference             | ❌ Manual state contracts          |

---

## 🚀 Get Started Now

```bash
npm install react-native-global-state-hooks
```

or

```bash
yarn add react-native-global-state-hooks
```

Then:

```tsx
import { Button } from "react-native";
import { createGlobalState } from "react-native-global-state-hooks";

const useCounter = createGlobalState(0);

function App() {
  const [count, setCount] = useCounter();

  return (
    <Button
      title={`Count: ${count}`}
      onPress={() => {
        setCount((current) => current + 1);
      }}
    />
  );
}
```

**That's it. You're managing shared React Native state.** 🎉

---

<div align="center">

### Built with ❤️ for developers who value simplicity

**[⭐ Star on GitHub](https://github.com/johnny-quesada-developer/react-native-global-state-hooks)** • **[📝 Report Issues](https://github.com/johnny-quesada-developer/react-native-global-state-hooks/issues)** • **[📦 NPM](https://www.npmjs.com/package/react-native-global-state-hooks)**

</div>
