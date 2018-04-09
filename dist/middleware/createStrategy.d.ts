import * as Redux from 'redux';
import { Strategy, RootState, StreamAction } from '../typings';
export default function createStrategy(strategy: Strategy): (store: Redux.Store<RootState>) => (next: Function) => (action: StreamAction) => void;
