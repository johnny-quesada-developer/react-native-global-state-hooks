# react-native-global-state-hooks
This is a package to easily handling global-state across your react-native-components **No-redux**.

This utility follows the same style as the default **useState** hook, this in order to be intuitive and easy to use

**after version 1.0.4, we migrated to @react-native-async-storage/async-storage, because @react-native-async-storage/async-storage has been deprecated!!**

## Creating a global store, an a simple hook

We are gonna create a global count example **useCountGlobal.ts**:

```JSX
import GlobalStore from 'react-native-global-state-hooks';

const countStore = new GlobalStore(0);

export const useCountGlobal = countStore.getHook();
```

That's it, that's a global store... Strongly typed, with a global-hook that we could reuse cross all our react-components.

## Consuming global hook
Let's say we have two components **Stage1**, **Stage2**, in order to use our global hook they will look just like: 
```JSX
import { useCountGlobal } from './useCountGlobal'

const Stage1: React.FC = () => {
  const [count, setter] = useCountGlobal();
  const onClickAddOne = () => setter(count + 1);

  return (<button onPress={onClickAddOne}>count: {count}<button/>);
}

const Stage2: React.FC = () => {
  const [count, setter] = useCountGlobal();
  const onClickAddTwo = () => setter(count + 2);
  
  return (<button onPress={onClickAddTwo}>count: {count}<button/>);
}
```

Just like that! You now are using a global state. 

Note that the only difference between this and the default **useState** hook is that you are not adding the initial value, cause you already did that when you created the store:
```JSX
const countStore = new GlobalStore(0);
```

## Persisted store

You could persist the state in the **async-storage** by just adding the **key-name** to the constructor of your global-store, for example: 
```JSX
// The FIRST parameter is the initial value of the state
// The Second parameter is an API to restrict access to the state, will talk about that later.
// The Third parameter is the key that will use on the async-storage
const countStore = new GlobalStore(0, null, 'GLOBAL_COUNT');
```

## Consuming Persisted Store

```JSX
const [count, setCount, isCountUpdated] = useCountGlobal();
```

**isCountUpdated**: With the persist storage, the first time the hooks is called the same is gonna return the default value declared in the **new GlobalStore**, at the same time will perform an **async** request to the **async-storage** in order to get the stored value, to validate if that call was already performed, youl'll get an extra boolean value.

## Decoupled hook

```JSX
import GlobalStore from 'react-native-global-state-hooks';

const countStore = new GlobalStore(0);

export const useCountGlobal = countStore.getHook();

export const [getCountGlobalValue, setCountGlobalValue] = countStore.getHookDecoupled();

```

If you want to access the global state outside a component or outside a hook, or without subscribing the component to the state changes... 

This is especially useful when you want to create components that have edition access to a certain store, but they actually don't need to be reactive to the state changes, like a search component that just need to get the current state every time that is going to search the data; but actually don't need to be subscribed to the changes over the collection he is going to be filtering. 


Let's see a trivial example: 
```JSX
import { useCountGlobal, setCountGlobalValue } from './useCountGlobal'

const Stage1: React.FC = () => {
  const [count] = useCountGlobal();

  return (<label>{count}<label/><br/>);
}

// Stage2 does not need to be updated once the global count changes
const Stage2: React.FC = () => {
  const increaseClick = () => setCountGlobalValue(count => count + 1);
  const decreaseClick = () => setCountGlobalValue(count => count - 1);

  return (<>
      <button onPress={increaseClick}>increase<button/>
      <button onPress={decreaseClick}>decrease<button/>
    </>);
}
```

## Advantages:
1. Using REACT's simplest and default way to deal with the state.
2. This library also is taking care of batching multiple stores updates by using **React unstable_batchedUpdates**; this is a problem that the **useState** have when you call multiple **setStates** into async flows as setTimeout
3. This tool also take care for you to avoid **async-storage*** data to lose the data types that you stored. For example when you are using datetimes

## Advance Config
[README]:./README.advance.md
