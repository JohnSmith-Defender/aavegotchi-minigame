import { AavegotchiObject } from 'types';
import { ChevronUp, ChevronDown } from 'assets/icons';
import { convertInlineSVGToBlobURL } from 'helpers/aavegotchi';
import styles from './styles.module.css';
import globalStyles from 'theme/globalStyles.module.css';
import { useEffect, useState } from 'react';

interface Props {
  gotchis?: Array<AavegotchiObject>;
  selectGotchi: (gotchi: AavegotchiObject) => void;
}

export const GotchiSelector = ({ gotchis, selectGotchi }: Props) => {
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (gotchis) {
      selectGotchi(gotchis[selected]);
    }
  }, [selected, gotchis, selectGotchi])

  return (
    <div className={styles.selectorContainer}>
      <ChevronUp width={24} />
      {
        gotchis === undefined ? <div>Loading</div> : gotchis?.map((gotchi, i) => {
          const isSelected = selected === i;
          return(
            <div className={`${styles.gotchiContainer} ${isSelected ? `${styles.selected} ${globalStyles.glow}` : ''}`} key={i}>
              <img src={convertInlineSVGToBlobURL(gotchi.svg)} alt={gotchi.name} />
            </div>
          )
        })
      }
      <ChevronDown width={24} />
    </div>
  )
}