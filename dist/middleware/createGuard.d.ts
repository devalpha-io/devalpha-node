/**
 * The guard middleware has the capability to alter orders or even prevent them from being
 * requested in the first place.
 *
 * @private
 * @param  {Object} settings A settings object.
 * @return {function} Middleware
 */
export default function createGuard(settings: any): (store: any) => (next: any) => (action: any) => any;
