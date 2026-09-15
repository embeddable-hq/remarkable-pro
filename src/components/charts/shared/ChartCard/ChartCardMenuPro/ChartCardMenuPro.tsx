import { IconDotsVertical } from '@tabler/icons-react';
import React from 'react';
import { useTheme } from '@embeddable.com/react';
import { ChartCardLoading } from '../ChartCardLoading/ChartCardLoading';
import { i18n, i18nSetup } from '../../../../../theme/i18n/i18n';
import { Theme } from '../../../../../theme/theme.types';
import {
  Dropdown,
  ActionIcon,
  SelectFieldContent,
  SelectListOption,
} from '@embeddable.com/remarkable-ui';
import styles from './ChartCardMenuPro.module.css';
import {
  ChartCardMenuOption,
  ChartCardMenuOptionOnClickProps,
} from '../../../../../theme/defaults/defaults.ChartCardMenu.constants';

type InlineSvgFromDataProps = React.HTMLAttributes<HTMLSpanElement> & {
  src: string;
};

export function InlineSvgFromData({ src, className, ...rest }: InlineSvgFromDataProps) {
  // Remove prefix and URL-decode the SVG markup
  const svgMarkup = decodeURIComponent(src.replace(/^data:image\/svg\+xml,/, ''));

  return <div className={className} {...rest} dangerouslySetInnerHTML={{ __html: svgMarkup }} />;
}

type ChartCardMenuProProps = Omit<ChartCardMenuOptionOnClickProps, 'theme'> & {
  menuOptions?: ChartCardMenuOption[];
};

export const ChartCardMenuPro: React.FC<ChartCardMenuProProps> = (props) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const [isLoading, setIsLoading] = React.useState(false);

  const { menuOptions } = props;

  if (menuOptions?.length === 0) {
    return null;
  }

  const startAction = (onClick: () => void | Promise<void>) => {
    setTimeout(() => {
      Promise.resolve(onClick()).finally(() => setIsLoading(false));
    }, 100);
  };

  const handleOptionClick = (option: ChartCardMenuOption) => {
    if (option.isInstantAction) {
      option.onClick({ ...props, theme });
      return;
    }
    setIsLoading(true);
    if (props.onCustomDownload) {
      props.onCustomDownload((args) => startAction(() => option.onClick(args)));
      return;
    }
    startAction(() => option.onClick({ ...props, theme }));
  };

  return (
    <Dropdown
      side="bottom"
      align="end"
      triggerComponent={isLoading ? <ChartCardLoading /> : <ActionIcon icon={IconDotsVertical} />}
    >
      <SelectFieldContent className={styles.list} autoFocus>
        {menuOptions?.map((option) => {
          return (
            <SelectListOption
              key={option.value}
              label={i18n.t(option.labelKey)}
              onClick={() => handleOptionClick(option)}
              startIcon={option.iconSrc ? <InlineSvgFromData src={option.iconSrc} /> : undefined}
            />
          );
        })}
      </SelectFieldContent>
    </Dropdown>
  );
};
