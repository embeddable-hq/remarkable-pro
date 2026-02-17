import { Divider } from '@embeddable.com/remarkable-ui';
import styles from './HorizontalDividerPro.module.css';

type HorizontalDividerProProps = {
  color?: string;
  thickness?: number;
};

const HorizontalDividerPro = (props: HorizontalDividerProProps) => {
  const { color, thickness } = props;

  return (
    <div className={styles.horizontalDividerContainer}>
      <Divider color={color} thickness={thickness} />
    </div>
  );
};

export default HorizontalDividerPro;
