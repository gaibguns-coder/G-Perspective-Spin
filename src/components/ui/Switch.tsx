interface SwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}

/** Toggle bar: sakelar geser untuk mengaktifkan/menonaktifkan menu. */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`toggle-bar${checked ? ' is-on' : ''}${disabled ? ' is-disabled' : ''}`}
    >
      <span className="toggle-knob" />
    </button>
  );
}
