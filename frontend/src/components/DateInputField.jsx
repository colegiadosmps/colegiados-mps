import { useId, useMemo, useRef, useState } from "react";
import { HiOutlineCalendarDays } from "react-icons/hi2";

const onlyDigits = (value) => String(value || "").replace(/\D/g, "").slice(0, 8);

const formatMaskedDate = (value) => {
  const digits = onlyDigits(value);

  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const isoToDisplay = (value) => {
  const cleaned = String(value || "").trim();
  const match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return cleaned;
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

const displayToIso = (value) => {
  const cleaned = String(value || "").trim();
  const match = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return "";
  }

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
};

const DateInputField = ({ defaultValue = "", name, placeholder = "dd/mm/aaaa", required = false, span }) => {
  const inputId = useId();
  const pickerRef = useRef(null);
  const [displayValue, setDisplayValue] = useState(() => isoToDisplay(defaultValue));
  const isoValue = useMemo(() => displayToIso(displayValue), [displayValue]);

  return (
    <label>
      {span ? <span>{span}</span> : null}
      <div className="date-input-field">
        <input
          autoComplete="off"
          inputMode="numeric"
          maxLength={10}
          onChange={(event) => setDisplayValue(formatMaskedDate(event.target.value))}
          placeholder={placeholder}
          required={required}
          value={displayValue}
        />
        <input name={name} type="hidden" value={isoValue || displayValue} />
        <input
          aria-hidden="true"
          className="date-input-field__native"
          onChange={(event) => setDisplayValue(isoToDisplay(event.target.value))}
          ref={pickerRef}
          tabIndex={-1}
          type="date"
          value={isoValue}
        />
        <button
          aria-label="Abrir calendario"
          className="date-input-field__trigger"
          onClick={() => {
            if (pickerRef.current?.showPicker) {
              pickerRef.current.showPicker();
              return;
            }

            pickerRef.current?.focus();
            pickerRef.current?.click();
          }}
          type="button"
        >
          <HiOutlineCalendarDays />
        </button>
      </div>
    </label>
  );
};

export default DateInputField;
