import React, { ReactNode } from 'react';
import { useTheme } from '@embeddable.com/react';
import { Theme, ThemeComponentRender, ThemeComponents } from '../../../../../theme/theme.types';

const Render = ({ render }: { render: ThemeComponentRender }) => <>{render(React)}</>;

export const ThemeComponent = ({
  name,
  fallback,
}: {
  name: keyof ThemeComponents;
  fallback: ReactNode;
}) => {
  const render = (useTheme() as Theme).components?.[name];
  return render ? <Render render={render} /> : fallback;
};
