import React, { ReactNode, useMemo } from 'react';
import { useTheme } from '@embeddable.com/react';
import { Theme, ThemeComponents } from '../../../../../theme/theme.types';

export const ThemeComponent = ({
  name,
  fallback,
}: {
  name: keyof ThemeComponents;
  fallback: ReactNode;
}) => {
  const render = (useTheme() as Theme).components?.[name];
  const Rendered = useMemo(() => render && (() => <>{render(React)}</>), [render]);
  return Rendered ? <Rendered /> : fallback;
};
