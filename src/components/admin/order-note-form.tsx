"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { saveOrderNote } from "@/app/actions/admin";

function SaveButton({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || !dirty}
      className="btn btn-primary btn-sm mt-2 w-full"
    >
      {pending ? "Saving…" : dirty ? "Save note" : "Saved"}
    </button>
  );
}

export function OrderNoteForm({ id, note }: { id: string; note: string }) {
  const [value, setValue] = useState(note);

  return (
    <form action={saveOrderNote}>
      <input type="hidden" name="id" value={id} />
      <textarea
        name="adminNote"
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Called twice, delivering after 7 PM…"
        className="field resize-y text-sm"
      />
      <SaveButton dirty={value !== note} />
    </form>
  );
}
