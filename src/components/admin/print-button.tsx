"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-outline btn-sm">
      Print invoice
    </button>
  );
}
