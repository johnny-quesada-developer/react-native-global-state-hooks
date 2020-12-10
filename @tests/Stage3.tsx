import React, { useCallback } from 'react';
import { StageTitle } from './fixtures';
import {
  useCountStoreDecoupled,
  useCountPercistDecoupled,
  useCountWithActionsDecoupled,
  useCountWithActionsTypedDecoupled,
  useCountWithActionsDecoupledP,
} from './globalStates';

export const Stage3 = () => {
  const [, setCount] = useCountStoreDecoupled();
  const [, setCountP] = useCountPercistDecoupled();
  const [, setCountWA] = useCountWithActionsDecoupled();
  const [, setCountWAT] = useCountWithActionsTypedDecoupled();
  const [, setCountWAP] = useCountWithActionsDecoupledP();

  const onPressCount = useCallback(() => setCount((count) => count + 1), []);
  const onPressCountP = useCallback(() => setCountP((countP) => countP + 1), []);

  const increaseCountWA = useCallback(() => setCountWA.increase(2), []);
  const decreaseCountWA = useCallback(() => setCountWA.decrease(2), []);

  const increaseCountWAT = useCallback(() => setCountWAT.increase(1), []);
  const decreaseCountWAT = useCallback(() => setCountWAT.decrease(1), []);

  const increaseCountWAP = useCallback(() => setCountWAP.increase(1), []);
  const decreaseCountWAP = useCallback(() => setCountWAP.decrease(1), []);

  return (
    <>
      <StageTitle title="Stage3" />
      <button title="increase count" onClick={onPressCount} />
      <button title="increase count persisted" onClick={onPressCountP} />
      <br></br>
      <button title="increase count with action" onClick={increaseCountWA} />
      <button title="increase with action typed" onClick={increaseCountWAT} />
      <button title="increase count with action typed persisted" onClick={increaseCountWAP} />
      <br></br>
      <button title="decrease count with action" onClick={decreaseCountWA} />
      <button title="decrease with action typed" onClick={decreaseCountWAT} />
      <button title="decrease count with action typed persisted" onClick={decreaseCountWAP} />
    </>
  );
};

export default Stage3;
