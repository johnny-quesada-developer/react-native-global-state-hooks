import React from 'react';
import { StageTitle, useCountHooks } from './fixtures';

export const Stage2 = () => {
  const {
    count,
    countPersisted,
    countWithActions,
    countWithActionsPersisted,
    countWithActionsTyped,
    onPressCount,
    onPressCountPersisted,
    onPressCountWithActions,
    onPressCountWithActionsPersisted,
    onPressCountWithActionsTyped,
  } = useCountHooks();

  return (
    <>
      <StageTitle title="Stage2" />
      <button title={`count: ${count}`} onClick={onPressCount} />
      <button title={`count persist: ${countPersisted}`} onClick={onPressCountPersisted} />
      <button title={`count with action PLUS: ${countWithActions}`} onClick={onPressCountWithActions} />
      <button title={`count with action typed PLUS: ${countWithActionsTyped}`} onClick={onPressCountWithActionsTyped} />
      <button title={`count with action typed PLUS persist: ${countWithActionsPersisted}`} onClick={onPressCountWithActionsPersisted} />
    </>
  );
};

export default Stage2;
