import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/** True when the device has a connected, reachable network. */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Get initial state
    void NetInfo.fetch().then((state: NetInfoState) => {
      setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
    });

    const unsub = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
    });
    return unsub;
  }, []);

  return isOnline;
}

/** One-shot check — useful outside React components. */
export async function checkIsOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
}
