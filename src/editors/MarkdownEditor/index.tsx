import { FC } from 'react';
import { MarkdownEditor } from '@embeddable.com/remarkable-ui';

type MarkdownInputProps = {
  value: string;
  onChange: (newValue: string) => void;
};

const MarkdownInput: FC<MarkdownInputProps> = ({ value, onChange }) => {
  return <MarkdownEditor value={value} onChange={onChange} />;
};

export default MarkdownInput;
