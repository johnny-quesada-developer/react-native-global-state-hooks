import { TMetadataResult } from "GlobalStore.types";
import { createGlobalStateWithDecoupledFuncs } from "../src/GlobalStore.functionHooks";
import { clone, isDate, isPrimitive } from "json-storage-formatter";
import React, { PropsWithChildren } from "react";
import {
  ActionCollectionConfig,
  createStateConfig,
  StateHook,
  StateSetter,
  ActionCollectionResult,
  StateGetter,
} from "react-hooks-global-states";

export const createStatefulContext = <
  TState,
  TMetadata = null,
  TActions extends ActionCollectionConfig<TState, TMetadata> = null
>(
  initialValue: TState,
  parameters?: createStateConfig<TState, TMetadata, TActions>
) => {
  type ContextHook = [
    hook: StateHook<
      TState,
      keyof TActions extends never
        ? StateSetter<TState>
        : ActionCollectionResult<TState, TMetadataResult<TMetadata>, TActions>,
      TMetadataResult<TMetadata>
    >,
    stateRetriever: StateGetter<TState>,
    stateMutator: keyof TActions extends never
      ? StateSetter<TState>
      : ActionCollectionResult<TState, TMetadata, TActions>
  ];

  const context = React.createContext<ContextHook>(null);

  const useHook = () => {
    return React.useContext(context);
  };

  const Provider: React.FC<
    PropsWithChildren<{
      initialValue?: Partial<TState>;
    }>
  > = ({ children, ...props }) => {
    const hook = createGlobalStateWithDecoupledFuncs<
      TState,
      TMetadata,
      TActions
    >(
      (() => {
        if (props.initialValue) {
          const isFunction = typeof props.initialValue === "function";

          if (isFunction)
            return (props.initialValue as unknown as (state: TState) => TState)(
              clone(initialValue)
            );

          const isArray = Array.isArray(props.initialValue);
          const isMap = props.initialValue instanceof Map;
          const isSet = props.initialValue instanceof Set;

          const isMergeAble =
            !isPrimitive(props.initialValue) &&
            !isDate(props.initialValue) &&
            !isArray &&
            !isMap &&
            !isSet;

          return (
            isMergeAble
              ? { ...initialValue, ...props.initialValue }
              : props.initialValue
          ) as TState;
        }

        // return a copy of the initial value to avoid reference issues
        // this initial value will be reused in all the instances of the hook
        return clone(initialValue);
      })(),
      parameters
    );

    return React.createElement(context.Provider, { value: hook }, children);
  };

  return [useHook, Provider] as const;
};
