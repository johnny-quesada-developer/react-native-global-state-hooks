## Creating hooks with reusable actions

Let's say you want to have a STATE with a specific set of actions that you could be reused. With this library is pretty easy to accomplish. Let's create **increase** and **decrease** actions to our count-store. **useCountGlobal.ts**:

```JSX
import {
  IActionCollectionConfig,
  IActionCollectionResult,
  StateSetter,
} from 'react-native-global-state-hooks/lib/GlobalStoreTypes';

/**
 * When using a custom api, the getHook and getHookDecoupled will not longer return directly the setter,
 * intead they will return and api with the specific actions and mutations defined for the store
 * Creating a configuration object for our api
 */
const countActionsApi: IActionCollectionConfig<number> = {
  /* Decrease the value of the count */
  decrease(decrease: number) {
    /**
     * We need to return the async function that is gonna take care of the state mutation or actions
     */
    return async (setter: StateSetter<number>, state: number) => {
      /**
       * Next, we perfom whatever modification we want on top of the store
       */
      return setter(state - decrease);
    };
  },

  //* Lets add a new action to increase the value of the count */
  increase(increase: number) {

    return async (setter: StateSetter<number>, state: number) => {
      return setter(state + increase);
    };
  },
};

/**
 *  Now our getHook and getHookDecoupled are gonna return our custom api instead of the StateSetter,
 *  This will allow us to have more control over our store since the mutations of the same are gonna be limitated 
*/
const countStore = new GlobalStore(0, countActionsApi);
```

If we remove all the explanatory comments the code will look like this:

```TS
const countStore = new GlobalStore(0, {
  decrease(decrease: number) {
    return (setter: StateSetter<number>, state: number) =>
      setter(state - decrease);
  },

  increase(increase: number) {
    return (setter: StateSetter<number>, state: number) =>
      setter(state + increase);
  },
} as IActionCollectionConfig<number>);
```

Now lets get our new global hook with specific API

```TS
export interface ICountActions
  extends IActionCollectionResult<number, IActionCollectionConfig<number>> {
  decrease: (decrease: number) => Promise<number>;
  increase: (increase: number) => Promise<number>;
}

/**
 * The ICountActions interface is optional but it allow you yo get more accurate results for the typescript autocompletes and validations, ignore this if you are not using TS
 */
export const useCountGlobal = countStore.getHook<ICountActions>();
```

And that's it! the result of our useCountGlobal will return our actions instead of a simple setter... Let's see how that will look:

```JSX
import { useCountGlobal } from './useCountGlobal'

const MyComponent: Reac.FC = () => {
  const [count, countActions] = useCountGlobal();

  // this functions are strongly typed 
  const increaseClick = () => countActions.increase(1);
  const decreaseClick = () => countActions.decrease(1);

  return (<>
      <Text>{count}<Text/>
      <Button onPress={increaseClick} title={'increase'} />
      <Button onPress={decreaseClick} title={'decrease'} />
    </>);
}

```

## Customize persist storage

Let suppose you don't like **async-storage** or you also want to implement some kind of encrypt-process. You could easily extend the **GlobalStore** Class, and customize your persist store implementation. 

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

  /** value is a json string*/
  protected asyncStorageSetItem = (value: string) => secureStorage.setItem(this.persistStoreAs as string, value, config);
  
}

export default SecureGlobalState;
```