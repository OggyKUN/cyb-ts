import { useEffect, useState, useMemo } from 'react';
import { connect, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import BigNumber from 'bignumber.js';

import { MainContainer } from '../portal/components';
import { SigmaContext } from './SigmaContext';

import { CardPassport } from './components';
import { FormatNumberTokens } from '../nebula/components';
import { CYBER } from '../../utils/config';
import { formatNumber } from '../../utils/utils';
import { ActionBar, ContainerGradientText } from '../../components';
import { useParams } from 'react-router-dom';
import { useGetPassportByAddress } from './hooks';
import { useRobotContext } from 'src/pages/robot/Robot';
import { RootState } from 'src/redux/store';
import ActionBarPortalGift from '../portal/gift/ActionBarPortalGift';
import STEP_INFO from '../portal/gift/utils';

const valueContext = {
  totalCap: 0,
  changeCap: 0,
  dataCap: {},
};

function Sigma({ address: preAddr }) {
  // const [accountsData, setAccountsData] = useState([]);
  const [value, setValue] = useState(valueContext);

  // const { addressActive: accounts } = useSetActiveAddress(defaultAccount);
  const { address, isOwner } = useRobotContext();
  const [step, setStep] = useState(STEP_INFO.STATE_PROVE);
  const [selectedAddress, setSelectedAddress] = useState<string>();

  const { accounts, defaultAccount } = useSelector(
    (state: RootState) => state.pocket
  );
  const { passport: defaultPassport } = useGetPassportByAddress(
    preAddr || defaultAccount?.account
  );

  const accountsData = [];

  if (address) {
    accountsData.push({
      bech32: address,
    });
  }

  // if (isO)
  // isOwner &&
  //   accounts &&
  // Object.keys(accounts).forEach((item) => {
  //   const { bech32 } = accounts[item]?.cyber || {};
  //   if (bech32 && !accountsData.find((item) => item.bech32 === bech32)) {
  //     accountsData.push({
  //       bech32,
  //     });
  //   }
  // });

  if (preAddr) {
    accountsData.push({
      bech32: preAddr,
    });
  }

  // const { accounts } = useGetLocalStoge(updateState);

  // useEffect(() => {
  //   const pocketAccountLs = localStorage.getItem('pocketAccount');
  //   const localStoragePocket = localStorage.getItem('pocket');

  //   let accountsTemp = {};

  //   if (pocketAccountLs !== null && localStoragePocket !== null) {
  //     const pocketAccountData = JSON.parse(pocketAccountLs);
  //     const localStoragePocketData = JSON.parse(localStoragePocket);

  //     const keyPocket = Object.keys(localStoragePocketData)[0];
  //     accountsTemp = {
  //       [keyPocket]: pocketAccountData[keyPocket],
  //       ...pocketAccountData,
  //     };
  //   }

  //   if (pocketAccountLs !== null) {
  //     const data = [];
  //     if (Object.keys(accountsTemp).length > 0) {
  //       Object.keys(accountsTemp).forEach((key) => {
  //         const { cyber } = accountsTemp[key];
  //         if (cyber) {
  //           data.push({ ...cyber });
  //         }
  //       });
  //     }
  //     if (data.length > 0) {
  //       setAccountsData(data);
  //     }
  //   }
  // }, [defaultAccount]);

  useEffect(() => {
    const { dataCap } = value;
    if (Object.keys(dataCap).length > 0) {
      let changeCap = new BigNumber(0);
      let tempCap = new BigNumber(0);
      Object.values(dataCap).forEach((item) => {
        changeCap = changeCap.plus(item.change);
        tempCap = tempCap.plus(item.currentCap);
      });
      updateChangeCap(changeCap);
      updateTotalCap(tempCap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.dataCap]);

  // get local store

  // check passport

  // check or set active

  const updateTotalCap = (cap) => {
    setValue((item) => ({
      ...item,
      totalCap: new BigNumber(cap).dp(0, BigNumber.ROUND_FLOOR).toNumber(),
    }));
  };

  const updateChangeCap = (cap) => {
    setValue((item) => ({
      ...item,
      changeCap: new BigNumber(cap).dp(0, BigNumber.ROUND_FLOOR).toNumber(),
    }));
  };

  const updateDataCap = (newData) => {
    setValue((item) => ({
      ...item,
      dataCap: { ...item.dataCap, ...newData },
    }));
  };

  function selectAddress(address) {
    setSelectedAddress(address);
  }

  const renderItem = useMemo(() => {
    if (accountsData.length > 0) {
      return accountsData.map(({ bech32: address }) => {
        return (
          <CardPassport
            key={address}
            address={address}
            selectAddress={selectAddress}
          />
        );
      });
    }

    return null;
  }, []);

  return (
    <SigmaContext.Provider
      // eslint-disable-next-line react/jsx-no-constructed-context-values
      value={{ ...value, updateTotalCap, updateChangeCap, updateDataCap }}
    >
      <div
        style={{
          overflowX: 'auto',
        }}
      >
        <div>
          <ContainerGradientText>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '16px',
              }}
            >
              <div>Total</div>
              <div
                style={{ display: 'flex', gap: '30px', alignItems: 'center' }}
              >
                {value.changeCap > 0 && (
                  <div
                    style={{
                      color: value.changeCap > 0 ? '#7AFAA1' : '#FF0000',
                    }}
                  >
                    {value.changeCap > 0 ? '+' : ''}
                    {formatNumber(value.changeCap)}
                  </div>
                )}
                <FormatNumberTokens
                  // styleValue={{ fontSize: '18px' }}
                  text={CYBER.DENOM_LIQUID_TOKEN}
                  value={value.totalCap}
                />
              </div>
            </div>
          </ContainerGradientText>
        </div>

        {renderItem}

        {/* <MainContainer width="82%">
        <CardPassport accounts={accounts} />
      </MainContainer> */}
        {/* <ActionBar updateFunc={updateStateFunc} /> */}
      </div>

      {selectedAddress && (
        <ActionBar
          button={{
            text: 'Action',
            onClick: () => {},
            disabled: true,
          }}
          text={selectedAddress}
        />
      )}

      {!selectedAddress && defaultPassport && (
        <ActionBarPortalGift
          setStepApp={setStep}
          activeStep={step}
          citizenship={defaultPassport}
          addressActive={{
            bech32: defaultAccount?.account,
          }}
        />
      )}
    </SigmaContext.Provider>
  );
}

export default Sigma;

// базаво давать добавть адрес и все
// для того что бы доваить космос , эфир , аватар надо создать паспорт
// можно сделать урезанный функционал
// надо добвать иконку что бы создал паспорт, можно другим цветм подсветить

// save address
// {
//     "bech32": "bostrom16macu2qtc0jmqc7txvf0wkz84cycsx728ah0xc",
//     "keyWallet": "keplr",
//     "name": "ledger S"
// }

// pasport sigma
// {
//  bostrom16macu2qtc0jmqc7txvf0wkz84cycsx728ah0xc: {
//     null;
//   }
// }
