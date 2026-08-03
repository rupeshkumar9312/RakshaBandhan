export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Rakhi Bazaar",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  tagline: "Handpicked rakhis, delivered to your door in Noida",
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "+91 98765 43210",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "care@rakhibazaar.in",
  society: "Amrapali Silicon City, Sector 76, Noida",
  festivalDate: "9 August 2026",
} as const;

export const TRUST_POINTS = [
  { title: "Same-day society delivery", body: "Order before 6 PM and it reaches your tower the same evening." },
  { title: "Cash on Delivery", body: "Pay the delivery partner at your door. No cards, no UPI needed." },
  { title: "Hand-checked quality", body: "Every rakhi is inspected and boxed by hand before it leaves." },
  { title: "Easy replacement", body: "Anything damaged in transit is replaced free, no questions." },
] as const;
