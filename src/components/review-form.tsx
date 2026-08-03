"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitReview, type ActionState } from "@/app/actions/shop";
import { StarIcon, CheckIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary btn-sm w-full">
      {pending ? "Posting…" : "Post review"}
    </button>
  );
}

export function ReviewForm({ productId }: { productId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(submitReview, null);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [open, setOpen] = useState(false);

  const errors = state && !state.ok ? state.errors : {};

  if (state?.ok) {
    return (
      <div className="card flex items-start gap-3 border-emerald-200 bg-emerald-50 p-4">
        <CheckIcon className="mt-0.5 size-5 shrink-0 text-emerald-700" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">Review posted</p>
          <p className="mt-0.5 text-xs text-emerald-800/80">{state.message}</p>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-outline btn-sm w-full">
        Write a review
      </button>
    );
  }

  return (
    <form action={action} className="card space-y-4 p-5">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <div>
        <span className="label">Your rating</span>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              className="p-0.5 transition-transform hover:scale-115"
            >
              <StarIcon
                filled={n <= (hover || rating)}
                className={cn("size-7", n <= (hover || rating) ? "text-gold-500" : "text-cream-300")}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="authorName" className="label">
          Your name
        </label>
        <input
          id="authorName"
          name="authorName"
          required
          placeholder="Priya S."
          className={cn("field", errors.authorName && "field-error")}
        />
        {errors.authorName && (
          <p className="mt-1 text-xs text-maroon-600">{errors.authorName}</p>
        )}
      </div>

      <div>
        <label htmlFor="title" className="label">
          Headline <span className="font-normal text-ink-muted">(optional)</span>
        </label>
        <input id="title" name="title" placeholder="Beautiful packaging" className="field" />
      </div>

      <div>
        <label htmlFor="body" className="label">
          Your review
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={4}
          placeholder="What did you think of the design, the quality, the delivery?"
          className={cn("field resize-y", errors.body && "field-error")}
        />
        {errors.body && <p className="mt-1 text-xs text-maroon-600">{errors.body}</p>}
      </div>

      {errors.form && (
        <p className="rounded-lg bg-maroon-50 px-3 py-2 text-xs text-maroon-700">{errors.form}</p>
      )}

      <div className="flex gap-2">
        <SubmitButton />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-ghost btn-sm shrink-0"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
