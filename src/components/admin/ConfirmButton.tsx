"use client";

import { useFormStatus } from "react-dom";

/** Submit button that asks for confirmation first and shows a pending state. */
export default function ConfirmButton({
  children,
  confirm,
  className,
}: {
  children: React.ReactNode;
  confirm?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? "…" : children}
    </button>
  );
}
