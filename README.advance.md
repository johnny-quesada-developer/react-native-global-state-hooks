
## Customize persist storage

Let suppose you don't like **async-storage** or you also want to implement some kind of encrypt-process. You could easily extend the **GlobalStore** Class, and customize your persist store implementation. 

## Creating hooks with reusable actions

Let's say you want to have a STATE with a specific set of actions that you could be reused. With this library is pretty easy to accomplish. Let's create **increase** and **decrease** actions to our COUNT-store. **useCountGlobal.ts**:

```JSX
import * as IGlobalState from 'react-native-global-state-hooks/lib/GlobalStoreTypes';
import GlobalStore from 'react-native-global-state-hooks';

export interface ICountActionsConfig extends IGlobalState.IActionCollectionConfig<number> {
  decrease: (decrease: number) => (setter: IGlobalState.StateSetter<number>, state: number) => Promise<void>,
  increase: (increase: number) => (setter: IGlobalState.StateSetter<number>, state: number) => Promise<void>,
}

export interface ICountActions extends IGlobalState.IActionCollectionResult {
  decrease: (decrease: number) => Promise<void>,
  increase: (increase: number) => Promise<void>,
}

const countActions: IActionCollectionConfig<number> = {
  decrease: (decrease: number) => async (setter: IGlobalState.StateSetter<number>, state: number) => {
    setter(state - decrease);
  },
  increase: (increase: number) => async (setter: IGlobalState.StateSetter<number>, state: number) => {
    setter(state + increase);
  },
};

const countStore = new GlobalStore(0, countActions);

export const useCountGlobal = countStore.getHook<ICountActions>();

```

Now the result of our useCountGlobal will return our actions instead of a simple setter... Let's see:

```JSX
import { useCountGlobal } from './useCountGlobal'

function Stage1() {
  const [count, actions] = useCountGlobal();

  const increaseClick = () => actions.increase(1);
  const decreaseClick = () => actions.decrease(1);

  return (<>
      <label>{count}<label/><br/>
      <button onPress={increaseClick}>increase<button/>
      <button onPress={decreaseClick}>decrease<button/>
    </>);
}

```

```JSX
import GlobalState from 'react-native-global-state-hooks';
import secureStorage from 'react-native-secure-storage';
import { IActionCollection } from 'react-native-global-state-hooks/lib/GlobalStoreTypes';

export class SecureGlobalState<
  IState,
  IPersist extends string | null = null,
  IsPersist extends boolean = IPersist extends null ? false : true,
  IActions extends IActionCollection<IState> | null = null
> extends GlobalState<IState, IPersist, IsPersist, IActions> {

  protected asyncStorageGetItem = () => secureStorage.getItem(this.persistStoreAs as string, config);

  protected asyncStorageSetItem = (value: string) => secureStorage.setItem(this.persistStoreAs as string, value, config);
  
}

export default SecureGlobalState;
```