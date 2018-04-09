import * as Redux from 'redux';
import { StreamAction, RootState, GuardOptions } from '../typings';
/**
 * The guard middleware has the capability to alter orders or even prevent them from being
 * requested in the first place.
 *
 * @private
 * @param  {Object} settings A settings object.
 * @return {function} Middleware
 */
export default function createGuard(settings: GuardOptions): (store: Redux.Store<RootState>) => (next: Function) => (action: StreamAction) => any;
