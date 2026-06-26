import React, { CSSProperties, useRef } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';
import {
  Card,
  CardContent,
  CardFeedback,
  CardHeader,
  Skeleton,
} from '@embeddable.com/remarkable-ui';
import styles from './ChartCard.module.css';
import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { useTheme } from '@embeddable.com/react';
import { ChartCardLoading } from './ChartCardLoading/ChartCardLoading';
import { ChartCardMenuPro } from './ChartCardMenuPro/ChartCardMenuPro';
import { Theme } from '../../../../theme/theme.types';
import { i18n, i18nSetup } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import clsx from 'clsx';
import { ChartCardMenuOptionOnClickProps } from '../../../../theme/defaults/defaults.ChartCardMenu.constants';

export type ChartCardHeaderProps = {
  title?: string;
  description?: string;
  tooltip?: string;
  hideMenu?: boolean;
  menuOptions?: (string | unknown)[];
};

export const asChartCardHeaderProps = <T extends ChartCardHeaderProps>(
  props: T,
): Omit<ChartCardHeaderProps, 'menuOptions'> & { menuOptions?: string[] } => {
  const { title, description, tooltip, hideMenu, menuOptions } = props;
  return {
    title,
    description,
    tooltip,
    hideMenu,
    menuOptions: menuOptions as string[] | undefined,
  };
};

type ChartCardProps = {
  children: React.ReactNode;
  data: DataResponse;
  errorMessage?: string;
  style?: CSSProperties;
  dimensionsAndMeasures?: (Dimension | Measure)[];
  onCustomDownload?: (props: (props: ChartCardMenuOptionOnClickProps) => void) => void;
} & Omit<ChartCardHeaderProps, 'menuOptions'> & { menuOptions?: string[] };

export const ChartCard = React.forwardRef<HTMLDivElement, ChartCardProps>((props, ref) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const { title, description, tooltip } = resolveI18nProps(props);
  const {
    children,
    data,
    errorMessage,
    dimensionsAndMeasures = [],
    hideMenu = false,
    onCustomDownload,
    menuOptions,
  } = props;

  const chartRef = useRef<HTMLDivElement>(null);

  const hasData = Boolean(data?.data && data.data?.length > 0);

  const isLoading = !data || data?.isLoading;

  const getDisplay = () => {
    if (isLoading && !hasData) {
      return <Skeleton />;
    }

    if (errorMessage) {
      return (
        <CardFeedback
          variant="error"
          icon={IconAlertCircle}
          title={i18n.t('charts.errorTitle')}
          message={errorMessage}
        />
      );
    }

    if (!hasData) {
      return (
        <CardFeedback title={i18n.t('charts.emptyTitle')} message={i18n.t('charts.emptyMessage')} />
      );
    }

    return children;
  };

  return (
    <Card className={styles.chartCard}>
      {hideMenu ? null : (
        <>
          <div className={styles.chartCardHeader}>
            <CardHeader title={title} subtitle={description} tooltip={tooltip} />
          </div>
          <div className={styles.chartCardRightContent}>
            <div className={clsx(!isLoading && styles.hidden)}>
              <ChartCardLoading />
            </div>
            <div className={clsx(isLoading && styles.hidden)}>
              <ChartCardMenuPro
                title={title}
                containerRef={chartRef}
                data={data?.data}
                dimensionsAndMeasures={dimensionsAndMeasures}
                onCustomDownload={onCustomDownload}
                menuOptions={menuOptions}
              />
            </div>
          </div>
        </>
      )}

      <CardContent ref={onCustomDownload ? ref : chartRef}>{getDisplay()}</CardContent>
    </Card>
  );
});

ChartCard.displayName = 'ChartCard';
