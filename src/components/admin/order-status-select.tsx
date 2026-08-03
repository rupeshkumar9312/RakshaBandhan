"use client";

import { useRef, useTransition } from "react";
import { updateOrderStatus } from "@/app/actions/admin";
import { ORDER_STATUSES, STATUS_LABELS, STATUS_STYLES, type OrderStatus } from "@/lib/utils";

export function OrderStatusSelect({ id, status }: { id: string; status: OrderStatus }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form ref={formRef} action={updateOrderStatus}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        disabled={pending}
        aria-label="Order status"
        onChange={() => startTransition(() => formRef.current?.requestSubmit())}
        className={`cursor-pointer rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-offset-2 disabled:opacity-50 ${
          STATUS_STYLES[status] ?? "bg-cream-200 text-ink-soft"
        }`}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
