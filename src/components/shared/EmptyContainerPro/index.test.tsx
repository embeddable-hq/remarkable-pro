import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EmptyBlockPro from './index';

describe('EmptyBlockPro', () => {
  it('renders without crashing', () => {
    const { container } = render(<EmptyBlockPro />);
    expect(container).toBeEmptyDOMElement();
  });
});
