/** Django/Oscar-style bootstrap form group, matching the original markup. */
export default function Field({
  name,
  label,
  type = "text",
  required = false,
  errors,
  defaultValue,
  textarea = false,
  maxLength,
  autoComplete,
  id,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  errors?: string[];
  defaultValue?: string | null;
  textarea?: boolean;
  maxLength?: number;
  autoComplete?: string;
  id?: string;
}) {
  const fid = id ?? `id_${name}`;
  const cls = `form-control${errors?.length ? " is-invalid" : ""}`;
  return (
    <div className="form-group">
      <label htmlFor={fid} className={`col-form-label${required ? " required" : ""}`}>
        {label}
      </label>
      <div className="">
        {textarea ? (
          <textarea name={name} cols={40} rows={10} className={cls} required={required} id={fid} defaultValue={defaultValue ?? undefined} />
        ) : (
          <input
            type={type}
            name={name}
            maxLength={maxLength}
            className={cls}
            required={required}
            id={fid}
            defaultValue={defaultValue ?? undefined}
            autoComplete={autoComplete}
          />
        )}
        {errors?.map((e) => (
          <div className="invalid-feedback d-block" key={e}>
            {e}
          </div>
        ))}
      </div>
    </div>
  );
}

export { default as SubmitButton } from "./PendingButton";
