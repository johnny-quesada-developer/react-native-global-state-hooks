import React from 'react';

import Stage1 from './Stage1';
import Stage2 from './Stage2';
import Stage3 from './Stage3';

export const Orchestrator = () => (
  <span>
    <Stage1 />
    <Stage2 />
    <Stage3 />
  </span>
);

export default Orchestrator;
