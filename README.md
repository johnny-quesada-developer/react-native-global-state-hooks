# react-native-global-state-hooks
This is a package to easily handling global-state across your react-native-components **No-redux**.

This utility follows the same style as the default **useState** hook, with a subscription pattern and HOFs to create a more intuitive, atomic and easy way of sharing state between components

**after version 1.0.4, we migrated to @react-native-async-storage/async-storage, because @react-native-async-storage/async-storage has been deprecated!!**

## Creating a global store, an a simple hook

We are gonna create a global count example **useCountGlobal.ts**:

```JSX
// Import the store costructor
import GlobalStore from 'react-native-global-state-hooks';

// initialize your store with the default value of the same.
const countStore = new GlobalStore(0);

// youll use this function the same way you'll use the **useState**
export const useCountGlobal = countStore.getHook();

// That's it, that's a global store... Strongly typed, with a global-hook that we could reuse cross all our react-components.
```

## Implementing your global hook into your components
Let's say we have two components **Stage1**, **Stage2**, in order to use our global hook they will look just like: 

```JSX
import { useCountGlobal } from './useCountGlobal'

const MyFirstComponent: React.FC = () => {
  const [count, setter] = useCountGlobal();
  const onClickAddOne = () => setter(count + 1);

  return (<button onPress={onClickAddOne}>count: {count}<button/>);
}

const MySecondComponent: React.FC = () => {
  const [count, setter] = useCountGlobal();
  const onClickAddTwo = () => setter(count + 2);
  
  return (<button onPress={onClickAddTwo}>count: {count}<button/>);
}

// Just like that! You are now using a global state!!
```

Note that the only difference between this and the default **useState** hook is that you are not adding the initial value, cause you already did that when you created the store:

```JSX
const countStore = new GlobalStore(0);
```

## Persisted store

You could persist the state with **@react-native-async-storage** by just adding the **key-name** to the constructor of your global-store, for example: 

```JSX
// The FIRST parameter is the initial value of the state
// The Second parameter is an API to restrict access to the state, will talk about that later.
// The Third parameter is the key that will be used on the async-storage
const countStore = new GlobalStore(0, null, 'GLOBAL_COUNT');
```

## Consuming Persisted Store

```JSX
const MyComponent: React.FC = () => {
  // connect the component to the global persisted storage
  const [count, setCount, isCountReady] = useCountGlobal();
  const onClickAddOne = () => setCount(count + 1);
  
  /**
   *  since the async storage is ASYNC, the first time the hook is called into a component we may get the default value, instead of the one from the storage.
   * 
   *  We are able to validate this with the third value returned in the hook array **isCountReady**, which is a boolean which let us now if the async storage already was reached out.
  */
  const countLabel = isCountReady ? `count: ${count}` : 'Loading async storage...';

  return (<button onPress={onClickAddOne}>{countLabel}<button/>);
}
```

## Decoupled hook

If you want to access the global state outside a component or outside a hook, or without subscribing the component to the state changes... 

This is especially useful when you want to create components that have edition access to a certain store, but they actually don't need to be reactive to the state changes, like a search component that just need to get the current state every time that is going to search the data; but actually don't need to be subscribed to the changes over the collection he is going to be filtering. 


```JSX
import GlobalStore from 'react-native-global-state-hooks';

const countStore = new GlobalStore(0);

// remember this should be used as the **useState** hook.
export const useCountGlobal = countStore.getHook();

// this functions are not hooks, and they can be used in whatever place into your code, ClassComponents, OtherHooks, Services etc.
export const [getCountGlobalValue, setCountGlobalValue] = countStore.getHookDecoupled();

```

Let's see a trivial example: 

```JSX
import { useCountGlobal, setCountGlobalValue } from './useCountGlobal'

const CountDisplayerComponent: React.FC = () => {
  const [count] = useCountGlobal();

  return (<label>{count}<label/><br/>);
}

// Stage2 does not need to be updated once the global count changes
const CountManagerComponent: React.FC = () => {
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
3. This tool also take care for you to avoid **async-storage*** data to lose the data types that you stored. For example when you are using datetimes

## Advance Config

Here you can see more information how to create more complex services for your global stores.
[README]:./README.advance.md
