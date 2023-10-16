import BigNumber from 'bignumber.js';
import { Pool } from '@cybercongress/cyber-js/build/codec/tendermint/liquidity/v1beta1/liquidity';
import { ObjKeyValue } from 'src/types/data';
import { Option } from 'src/types';
import { IbcDenomsArr } from 'src/types/ibc';
import coinDecimalsConfig from '../../utils/configToken';
import { MyPoolsT } from './type';

export function sortReserveCoinDenoms(x, y) {
  return [x, y].sort();
}

export const checkInactiveFunc = (
  token: string,
  ibcDataDenom: Option<IbcDenomsArr>
): boolean => {
  if (token.includes('ibc') && ibcDataDenom) {
    if (!Object.prototype.hasOwnProperty.call(ibcDataDenom, token)) {
      return false;
    }
  }
  return true;
};

export function getMyTokenBalanceNumber(denom: string, indexer) {
  return Number(getMyTokenBalance(denom, indexer).split(':')[1].trim());
}

function pow(a) {
  let result = 1;
  for (let i = 0; i < a; i++) {
    result *= 10;
  }
  return result;
}

export function getMyTokenBalance(token, indexer) {
  if (indexer === null) {
    return `My Balance: 0`;
  }
  const balance = Number(Number(indexer[token])).toFixed(2);
  if (balance !== 'NaN') {
    return `My Balance: ${balance}`;
  }
  return `My Balance: 0`;
}

export const getCoinDecimals = (amount, token) => {
  let amountReduce = amount;

  if (Object.prototype.hasOwnProperty.call(coinDecimalsConfig, token)) {
    const { coinDecimals } = coinDecimalsConfig[token];
    if (coinDecimals) {
      amountReduce = parseFloat(amount) / pow(coinDecimals);
    }
  }
  return amountReduce;
};

const getDecimals = (denom) => {
  let decimals = 0;
  if (Object.hasOwnProperty.call(coinDecimalsConfig, denom)) {
    decimals = coinDecimalsConfig[denom].coinDecimals;
  }
  return decimals;
};

const getCounterPairAmount = (amount, decimals, swapPrice) => {
  const inputAmountBN = new BigNumber(amount);
  return inputAmountBN
    .dividedBy(swapPrice)
    .dp(decimals, BigNumber.ROUND_FLOOR)
    .toString();
};

export function calculateCounterPairAmount(values, e, state) {
  const inputAmount = values;

  let counterPairAmount = 0;

  const { tokenAPoolAmount, tokenA, tokenBPoolAmount, tokenB } = state;

  const poolAmountA = new BigNumber(
    getCoinDecimals(Number(tokenAPoolAmount), tokenA)
  );
  const poolAmountB = new BigNumber(
    getCoinDecimals(Number(tokenBPoolAmount), tokenB)
  );

  if (
    inputAmount.length > 0 &&
    poolAmountA.comparedTo(0) > 0 &&
    poolAmountB.comparedTo(0) > 0
  ) {
    let swapPrice = null;
    let decimals = 0;

    if (e.target.id === 'tokenAAmount') {
      swapPrice = poolAmountA.dividedBy(poolAmountB);
      swapPrice = swapPrice.multipliedBy(1.03).toNumber();
      if (tokenB.length > 0) {
        decimals = getDecimals(tokenB);
      }
      counterPairAmount = getCounterPairAmount(
        inputAmount,
        decimals,
        swapPrice
      );
    } else {
      swapPrice = poolAmountB.dividedBy(poolAmountA);
      swapPrice = swapPrice.multipliedBy(0.97).toNumber();

      if (tokenA.length > 0) {
        decimals = getDecimals(tokenA);
      }
      counterPairAmount = getCounterPairAmount(
        inputAmount,
        decimals,
        swapPrice
      );
    }
  }
  return {
    counterPairAmount,
  };
}

const decFnc = (number, dec, reverse) => {
  let amount = number;

  if (reverse) {
    if (dec > 0) {
      amount = parseFloat(number) * pow(dec);
    }
  } else if (dec > 0) {
    amount = parseFloat(number) / pow(dec);
  }
  return amount;
};

export const reduceAmounToken = (amount, token, reverse) => {
  let amountReduce = amount;

  // if (token === 'millivolt' || token === 'milliampere') {
  //   if (reverse) {
  //     amountReduce = amount * 10 ** 3;
  //   } else {
  //     amountReduce = amount * 10 ** -3;
  //   }
  // }

  if (Object.prototype.hasOwnProperty.call(coinDecimalsConfig, token)) {
    const { coinDecimals } = coinDecimalsConfig[token];
    if (reverse) {
      amountReduce = decFnc(parseFloat(amount), coinDecimals, reverse);
    } else {
      amountReduce = decFnc(parseFloat(amount), coinDecimals, reverse);
    }
  }

  return amountReduce;
};

const reduceTextCoin = (text) => {
  switch (text) {
    case 'millivolt':
      return 'V';

    case 'milliampere':
      return 'A';

    case 'hydrogen':
      return 'H';

    case 'boot':
      return 'BOOT';

    default:
      return text;
  }
};

export function getPoolToken(
  pool: Pool[],
  myPoolTokens: ObjKeyValue
): MyPoolsT[] {
  const myPools: MyPoolsT[] = [];

  pool.forEach((item) => {
    if (
      Object.prototype.hasOwnProperty.call(myPoolTokens, item.poolCoinDenom)
    ) {
      const myTokenAmount = myPoolTokens[item.poolCoinDenom];
      myPools.push({
        ...item,
        coinDenom: `${reduceTextCoin(
          item.reserveCoinDenoms[0]
        )}-${reduceTextCoin(item.reserveCoinDenoms[1])}`,
        myTokenAmount,
      });
    }
  });

  return myPools;
}

export const networkList = {
  bostrom: 'bostrom',
  'osmosis-1': 'osmosis-1',
  'cosmoshub-4': 'cosmoshub-4',
  'space-pussy': 'space-pussy',
  'juno-1': 'juno-1',
  'gravity-bridge-3': 'gravity-bridge-3',
  'desmos-mainnet': 'desmos-mainnet',
  // evmos: 'evmos_9001-2',
  // chihuahua: 'chihuahua-1',
};