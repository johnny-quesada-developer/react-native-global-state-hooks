import React, { useCallback } from 'react';
import { StageTitle } from './fixtures';
import {
  useCountStore, useCountPercist, useCountWithActions, useCountWithActionsTyped, useCountWithActionsP,
} from './hooks';

export const Stage1 = () => {
  const [count, setCount] = useCountStore();
  const [countP, setCountP] = useCountPercist();

  const [countWA, setCountWA] = useCountWithActions();
  const [countWAT, setCountWAT] = useCountWithActionsTyped();
  const [countWAP, setCountWAP] = useCountWithActionsP();

  const onPressCount = useCallback(() => {
    setCount((_count) => _count + 1);
  }, []);
  const onPressCountP = useCallback(() => setCountP((_countP) => _countP + 1), []);
  const onPressCountWA = useCallback(() => setCountWA.increase(2), []);
  const onPressCountWAT = useCallback(() => setCountWAT.increase(1), []);
  const onPressCountWAP = useCallback(() => setCountWAP.increase(1), []);

  return (
    <>
      <StageTitle title="Stage1" />
      <button title={`count: ${count}`} onClick={onPressCount} />
      <button title={`count persist: ${countP}`} onClick={onPressCountP} />
      <button title={`count with action PLUS: ${countWA}`} onClick={onPressCountWA} />
      <button title={`count with action typed PLUS: ${countWAT}`} onClick={onPressCountWAT} />
      <button title={`count with action typed PLUS persist: ${countWAP}`} onClick={onPressCountWAP} />
    </>
  );
};

export default Stage1;
