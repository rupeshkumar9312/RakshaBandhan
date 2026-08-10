"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { trackOrder } from "@/app/actions/shop";
import { OrderTracker } from "@/components/order-tracker";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-primary w-full py-3.5"
    >
      {pending ? "Looking up…" : "Find my order"}
    </button>
  );
}

export function TrackOrderForm() {
  const [state, action] = useActionState(trackOrder, null);

  const order = state?.ok ? state.order : null;

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
            placeholder="75990 31402"
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

      {order && <OrderTracker order={order} />}
    </div>
  );
}
