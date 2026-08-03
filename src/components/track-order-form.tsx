"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { trackOrder } from "@/app/actions/shop";
import { formatPaise } from "@/lib/money";
import { formatDate, STATUS_LABELS, ORDER_STATUSES, type OrderStatus } from "@/lib/utils";
import { CheckIcon, PackageIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const TIMELINE: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary w-full py-3.5">
      {pending ? "Looking up…" : "Find my order"}
    </button>
  );
}

export function TrackOrderForm() {
  const [state, action] = useActionState(trackOrder, null);

  const order = state?.ok ? state.order : null;
  const currentIndex = order ? TIMELINE.indexOf(order.status as OrderStatus) : -1;
  const cancelled = order?.status === "CANCELLED";

  return (
    <div className="space-y-6">
      <form action={action} className="card space-y-4 p-6">
        <div>
          <label htmlFor="orderNumber" className="label">
            Order number
          </label>
          <input
            id="orderNumber"
            name="orderNumber"
            required
            placeholder="RB-2508-0001"
            autoComplete="off"
            className="field font-mono uppercase"
          />
        </div>

        <div>
          <label htmlFor="phone" className="label">
            Mobile number
          </label>
          <input
            id="phone"
            name="phone"
            required
            type="tel"
            inputMode="numeric"
            placeholder="98765 43210"
            autoComplete="tel"
            className="field"
          />
        </div>

        {state && !state.ok && (
          <p className="rounded-lg bg-maroon-50 px-3 py-2.5 text-sm text-maroon-800">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>

      {order && (
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Order</p>
              <p className="font-display text-xl font-bold text-maroon-800">{order.orderNumber}</p>
              <p className="mt-1 text-xs text-ink-muted">
                Placed {formatDate(order.placedAt, true)}
              </p>
            </div>
            <span
              className={cn(
                "chip",
                cancelled ? "bg-maroon-100 text-maroon-800" : "bg-emerald-100 text-emerald-800",
              )}
            >
              {STATUS_LABELS[order.status as OrderStatus] ?? order.status}
            </span>
          </div>

          {!cancelled && (
            <ol className="mt-7 space-y-0">
              {TIMELINE.map((status, i) => {
                const done = i <= currentIndex;
                const isCurrent = i === currentIndex;
                return (
                  <li key={status} className="flex gap-3.5">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-full transition-colors",
                          done ? "bg-emerald-600 text-white" : "bg-cream-200 text-ink-muted",
                        )}
                      >
                        {done ? (
                          <CheckIcon className="size-4" />
                        ) : (
                          <PackageIcon className="size-4" />
                        )}
                      </span>
                      {i < TIMELINE.length - 1 && (
                        <span
                          className={cn(
                            "my-1 w-0.5 flex-1 rounded-full",
                            i < currentIndex ? "bg-emerald-600" : "bg-cream-300",
                          )}
                        />
                      )}
                    </div>
                    <div className={cn("pb-6", i === TIMELINE.length - 1 && "pb-0")}>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          isCurrent ? "text-maroon-800" : done ? "text-ink" : "text-ink-muted",
                        )}
                      >
                        {STATUS_LABELS[status]}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {status === "PENDING" && "We've received your order."}
                        {status === "PROCESSING" && "Your rakhis are being packed."}
                        {status === "SHIPPED" && "On the way to your tower."}
                        {status === "DELIVERED" && "Handed over. Happy Raksha Bandhan!"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {cancelled && (
            <p className="mt-5 rounded-lg bg-maroon-50 px-4 py-3 text-sm text-maroon-800">
              This order was cancelled. If that wasn&apos;t you, please give us a call.
            </p>
          )}

          <ul className="mt-6 divide-y divide-cream-300 border-t border-cream-300">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  {item.nameSnapshot}
                  <span className="ml-1.5 text-xs text-ink-muted">× {item.quantity}</span>
                </span>
                <span className="font-semibold tabular-nums">{formatPaise(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-between border-t border-cream-300 pt-4">
            <span className="font-bold">Total {order.status === "DELIVERED" ? "paid" : "payable"}</span>
            <span className="font-bold tabular-nums text-maroon-800">
              {formatPaise(order.total)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
