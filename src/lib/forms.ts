export type FormState =
  | { errors?: Record<string, string[]>; message?: string; values?: Record<string, string> }
  | undefined;

/** Echo submitted values back so fields can be refilled (React 19 resets forms after an action). Never passwords. */
export function echo(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  form.forEach((v, k) => {
    if (typeof v === "string" && !/password/i.test(k) && !k.startsWith("$")) out[k] = v;
  });
  return out;
}
