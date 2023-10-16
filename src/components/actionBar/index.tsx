import React, { useEffect, useState } from 'react';
import { $TsFixMeFunc } from 'src/types/tsfix';
import { useSelector } from 'react-redux';
import { RootState } from 'src/redux/store';
import { routes } from 'src/routes';
import { CYBER } from 'src/utils/config';
import { useLocation, useNavigate } from 'react-router-dom';
import { Networks } from 'src/types/networks';
import ButtonIcon from '../buttons/ButtonIcon';
import styles from './styles.scss';
import Button from '../btnGrd';
import usePassportByAddress from 'src/features/passport/hooks/usePassportByAddress';
import { id } from 'src/containers/application/Header/Commander/Commander';

const back = require('../../image/arrow-left-img.svg');

function ActionBarContainer({ children }) {
  return (
    <div className={styles.ActionBarContainer}>
      <div className={styles.ActionBarContainerContent}>{children}</div>
    </div>
  );
}

function ActionBarContentText({ children, ...props }) {
  return (
    <div className={styles.ActionBarContentText} {...props}>
      {children}
    </div>
  );
}

type Props = {
  children?: React.ReactNode;
  onClickBack?: $TsFixMeFunc;
  text?: string | React.ReactNode;
  button?: {
    text: string | React.ReactNode;
    onClick?: () => void;
    link?: string;
    disabled?: boolean;
  };
};

function ActionBar({ children, text, onClickBack, button }: Props) {
  const location = useLocation();
  const navigate = useNavigate();

  const [commanderFocused, setCommanderFocused] = useState(false);

  const { defaultAccount } = useSelector((store: RootState) => {
    return {
      defaultAccount: store.pocket.defaultAccount,
    };
  });

  const { passport } = usePassportByAddress(
    defaultAccount?.account?.cyber?.bech32 || null
  );

  const noAccount = !defaultAccount.account;
  const noPassport = CYBER.CHAIN_ID === Networks.BOSTROM && !passport;

  useEffect(() => {
    const commander = document.getElementById(id);

    function onFocus() {
      setCommanderFocused(true);
    }

    function onBlur(e) {
      if (e.relatedTarget?.tagName.toLowerCase() === 'button') {
        e.relatedTarget.click();
      }
      setCommanderFocused(false);
    }

    if (commander) {
      commander.addEventListener('focus', onFocus);
      commander.addEventListener('blur', onBlur);
    }

    return () => {
      if (commander) {
        commander.removeEventListener('focus', onFocus);
        commander.removeEventListener('blur', onBlur);
      }
    };
  }, [id]);

  // TODO: not show while loading passport

  // refactor
  if (commanderFocused && location.pathname !== '/') {
    return (
      <ActionBarContainer>
        <Button
          onClick={() => {
            navigate(
              routes.search.getLink(
                document.getElementById(id)?.value?.replace('~', '')
              )
            );
          }}
          // link={routes.search.getLink(val)}
        >
          Ask
        </Button>
      </ActionBarContainer>
    );
  }

  if (
    (noAccount || noPassport) &&
    // maybe change to props
    ((location.pathname !== routes.keys.path &&
      !location.pathname.includes('/drive') &&
      !location.pathname.includes('/oracle') &&
      location.pathname !== '/') ||
      location.pathname === '/oracle/learn')
  ) {
    return (
      <ActionBarContainer>
        {noAccount && <Button link={routes.keys.path}>Connect</Button>}

        {noPassport && location.pathname !== routes.citizenship.path && (
          <Button link={routes.portal.path}>Get citizenship</Button>
        )}
      </ActionBarContainer>
    );
  }

  const content = text || children;

  return (
    <ActionBarContainer>
      {/* <Telegram /> */}

      {onClickBack && (
        <ButtonIcon
          styleContainer={{ position: 'absolute', left: '0' }}
          style={{ padding: 0 }}
          img={back}
          onClick={onClickBack}
          text="previous step"
        />
      )}

      {content && <ActionBarContentText>{content}</ActionBarContentText>}

      {button?.text && (
        <Button
          disabled={button.disabled}
          link={button.link}
          onClick={button.onClick}
        >
          {button.text}
        </Button>
      )}
      {/* <GitHub /> */}
    </ActionBarContainer>
  );
}

export default ActionBar;