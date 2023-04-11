import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useSdk from 'src/hooks/useSdk';
import { Params } from '@cybercongress/cyber-js/build/codec/tendermint/liquidity/v1beta1/liquidity';
import { QueryParamsResponse } from '@cybercongress/cyber-js/build/codec/tendermint/liquidity/v1beta1/query';
import { Option } from 'src/types/common';

function useGetParams() {
  const { queryClient } = useSdk();
  const { data } = useQuery(
    ['liquidityParams'],
    () => {
      return queryClient?.liquidityParams() as Option<QueryParamsResponse>;
    },
    {
      enabled: Boolean(queryClient),
    }
  );
  const [params, setParams] = useState<Params>();

  useEffect(() => {
    const getLiquidityParams = () => {
      if (data !== undefined) {
        setParams(data.params);
      }
    };
    getLiquidityParams();
  }, [data]);

  return params;
}

export default useGetParams;
