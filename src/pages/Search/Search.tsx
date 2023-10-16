import { ActionBar, Button, MainContainer } from 'src/components';
import { routes } from 'src/routes';
import styles from './Search.module.scss';
import { id } from 'src/containers/application/Header/Commander/Commander';
import { useEffect } from 'react';
// import useCanvas from 'src/containers/temple/components/canvasOne/useCanvas';
import TitleText from './TitleText/TitleText';
import KeywordButton from './KeywordButton/KeywordButton';

function Search() {
  // const { canvasRef } = useCanvas();

  useEffect(() => {
    const commander = document.getElementById(id);
    if (commander) {
      commander.focus();
    }
  }, []);
  return (
    <MainContainer width="100%">
      <header className={styles.header}>
        {['cyber', 'donut of knowledge', 'help'].map((keyword) => {
          return <KeywordButton key={keyword} keyword={keyword} />;
        })}
      </header>

      <div className={styles.content}>
        {/* <canvas
          className={styles.slider}
          // style={{ top: mediaQuery ? '12%' : '6%' }}
          ref={canvasRef}
          id="canvasOne"
          width="300"
          height="320"
        /> */}

        <div className={styles.info}>
          <h2>
            decentralized <span>search</span> <br />
            is here
          </h2>
          <div className={styles.imgWrapper}>
            <img
              className={styles.image}
              src={require('./img.png')}
              alt="cyber"
            />
          </div>

          <div className={styles.particles}>
            <h4>111 000 particles</h4>
            <span>+ 5%</span> <span>in 3 hours</span>
          </div>
        </div>

        <ul className={styles.advantages}>
          {[
            {
              title: 'censorfree',
              text: (
                <>
                  its a blockchain <br /> limitless participation
                </>
              ),
            },
            {
              title: 'direct',
              text: (
                <>
                  pure content <br /> directly from peers
                </>
              ),
            },
            {
              title: 'instant',
              text: (
                <>
                  your content is searchable <br /> in 5 seconds
                </>
              ),
            },
          ].map(({ title, text }) => {
            return (
              <li key={title}>
                <TitleText title={title} text={text} />
              </li>
            );
          })}
        </ul>
      </div>

      <ActionBar>
        <Button link={'/particles'}>get high</Button>
        <Button link={routes.oracle.learn.path}>how to learn</Button>
      </ActionBar>
    </MainContainer>
  );
}

export default Search;