import { currencies } from '../../utils/currency';

interface CurrencySelectProps {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

export const CurrencySelect = ({ value, onChange, className = 'input' }: CurrencySelectProps) => {
  return (
    <select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      {currencies.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} — {c.nameAr} ({c.symbol})
        </option>
      ))}
    </select>
  );
};
