import { useState } from 'react';
import './ConfirmCheckbox.css';

export const ConfirmCheckbox = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
}) => {
  const [confirming, setConfirming] = useState(false);

  const handleClick = () => {
    if (confirming) {
      onChange(!checked);
      setConfirming(false);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
    }
  };

  return (
    <button
      className={`confirm-checkbox ${checked ? 'checked' : ''} ${confirming ? 'confirming' : ''}`}
      onClick={handleClick}
    >
      <span className="checkbox-box">{checked ? '✓' : ''}</span>
      <span className="checkbox-label">{confirming ? 'Click to confirm' : label}</span>
    </button>
  );
};
