import './SavingToast.css';

interface SavingToastProps {
  visible: boolean;
}

export function SavingToast({ visible }: SavingToastProps) {
  if (!visible) return null;
  return (
    <div className="saving-toast" role="status" aria-live="polite">
      <span className="saving-toast-dot" />
      Saving...
    </div>
  );
}
