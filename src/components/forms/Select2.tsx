"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type Option = { value: string; label: string };

/** Minimal select2 ("default" theme) replacement emitting select2's markup for the original CSS. */
export default function Select2({
  name,
  options,
  value,
  onChange,
  placeholder,
  allowClear = false,
  disabled = false,
  required = false,
}: {
  name: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  allowClear?: boolean;
  disabled?: boolean;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [hi, setHi] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const search = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(term.toLowerCase())),
    [options, term],
  );
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    setTerm("");
    setHi(Math.max(0, options.findIndex((o) => o.value === value)));
    setTimeout(() => search.current?.focus(), 0);
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (o: Option) => {
    onChange(o.value);
    setOpen(false);
  };

  return (
    <span
      ref={ref}
      className={`select2 select2-container select2-container--default amx-select2${open ? " select2-container--open select2-container--below" : ""}${disabled ? " select2-container--disabled" : ""}`}
      dir="ltr"
    >
      {/* real value for the form + native "required" validation */}
      <select
        name={name}
        value={value}
        required={required}
        onChange={() => {}}
        className="select2-hidden-accessible"
        tabIndex={-1}
        aria-hidden="true"
      >
        <option value=""></option>
        {selected && <option value={selected.value}>{selected.label}</option>}
      </select>
      <span className="selection">
        <span
          className="select2-selection select2-selection--single"
          role="combobox"
          aria-haspopup="true"
          aria-expanded={open}
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (!disabled && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
              e.preventDefault();
              setOpen(true);
            }
          }}
        >
          <span className="select2-selection__rendered" title={selected?.label}>
            {allowClear && selected && (
              <span
                className="select2-selection__clear"
                title="Remove all items"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
              >
                ×
              </span>
            )}
            {selected ? selected.label : <span className="select2-selection__placeholder">{placeholder}</span>}
          </span>
          <span className="select2-selection__arrow" role="presentation">
            <b role="presentation"></b>
          </span>
        </span>
      </span>
      {open && (
        <span className="select2-dropdown select2-dropdown--below">
          <span className="select2-search select2-search--dropdown">
            <input
              ref={search}
              className="select2-search__field"
              type="search"
              autoComplete="off"
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                setHi(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHi((h) => Math.min(h + 1, filtered.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHi((h) => Math.max(h - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (filtered[hi]) pick(filtered[hi]);
                } else if (e.key === "Escape") setOpen(false);
              }}
            />
          </span>
          <span className="select2-results">
            <ul className="select2-results__options" role="listbox">
              {filtered.length === 0 && (
                <li className="select2-results__option select2-results__message">No results found</li>
              )}
              {filtered.map((o, i) => (
                <li
                  key={o.value}
                  role="option"
                  aria-selected={o.value === value}
                  className={`select2-results__option${i === hi ? " select2-results__option--highlighted" : ""}`}
                  onMouseEnter={() => setHi(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(o);
                  }}
                >
                  {o.label}
                </li>
              ))}
            </ul>
          </span>
        </span>
      )}
    </span>
  );
}
