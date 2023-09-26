import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'src/redux/hooks';
import { proxy } from 'comlink';
import { backendApi } from 'src/services/backend/workers/background/service';

import BcChannel from 'src/services/backend/channels/BroadcastChannel';
import dbApiService from 'src/services/backend/workers/db/service';
import { CYBER } from 'src/utils/config';

import { getIpfsOpts } from './ipfs';

type BackendProviderContextType = {
  startSyncTask?: () => void;
  backendApi?: typeof backendApi;
};

const valueContext = {
  startSyncTask: undefined,
  backendApi: undefined,
};

const BackendContext =
  React.createContext<BackendProviderContextType>(valueContext);

export function useBackend() {
  return useContext(BackendContext);
}

function BackendProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { defaultAccount } = useAppSelector((state) => state.pocket);
  const [isInitialized, setIsInitialized] = useState(false);

  const useGetAddress = defaultAccount?.account?.cyber?.bech32 || null;

  const channelRef = useRef<BcChannel>();

  useEffect(() => {
    (async () => {
      console.log(
        process.env.IS_DEV
          ? '🧪 Starting backend in DEV mode...'
          : '🧬 Starting backend in PROD mode...'
      );
      await dbApiService
        .init()
        .then(() => console.log('🔋 CozoDb thread up', dbApiService));
      await backendApi
        .init(getIpfsOpts(), proxy(dbApiService))
        .then(() => console.log('🔋 Background thread up'));

      setIsInitialized(true);
    })();

    // Channel to sync worker's state with redux store
    channelRef.current = new BcChannel((msg) => dispatch(msg.data));
  }, []);
  console.log('-----backend context', isInitialized, backendApi);
  const valueMemo = useMemo(
    () => ({
      startSyncTask: async () =>
        backendApi.syncDrive(useGetAddress, CYBER.CYBER_INDEX_HTTPS),
      backendApi: isInitialized ? backendApi : undefined,
      dbApi: isInitialized ? dbApiService : undefined,
    }),
    [useGetAddress, isInitialized]
  );

  return (
    <BackendContext.Provider value={valueMemo}>
      {children}
    </BackendContext.Provider>
  );
}

export default BackendProvider;
