"use client";

import { useFormStatus } from "react-dom";

export default function PendingButton({
  children,
  pendingText,
  className = "btn btn-primary",
  name,
}: {
  children: React.ReactNode;
  pendingText: string;
  className?: string;
  name?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} name={name}>
      {pending ? pendingText : children}
    </button>
  );
}
