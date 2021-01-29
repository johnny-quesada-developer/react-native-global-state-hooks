import React from 'react';
import * as IGlobalState from '../src/GlobalStoreTypes';

export const StageTitle = ({ title }: { title: string }) => <h1>{title}</h1>;

export default StageTitle;

export interface ICountActions extends IGlobalState.ActionCollectionResult<IGlobalState.IActionCollection<number>> {
  decrease: (decrease: number) => (setter: IGlobalState.StateSetter<number>, state: number) => Promise<void>,
  increase: (increase: number) => (setter: IGlobalState.StateSetter<number>, state: number) => Promise<void>,
}
