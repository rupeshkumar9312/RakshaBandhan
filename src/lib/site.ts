export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Gift Buddy",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  tagline: "Your Gifting Partner",
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "+91 7599031402",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "care@rakhibazaar.in",
  society: "The Golden Palms, Sector 168, Noida",
  festivalDate: "28 August 2026",
} as const;

/** The Raksha Bandhan storefront — the first occasion live inside Gift Buddy. */
export const RAKHI_BRAND = {
  name: "Rakhi Bazaar",
  tagline: "Handpicked rakhis, delivered to your door in Noida",
} as const;

export const TRUST_POINTS = [
  { title: "Same-day society delivery", body: "Order before 6 PM and it reaches your tower the same evening." },
  { title: "Cash on Delivery", body: "Pay the delivery partner at your door. Cash/UPI only." },
  { title: "Hand-checked quality", body: "Every rakhi is inspected and boxed by hand before it leaves." },
  { title: "Easy replacement", body: "Anything damaged in transit is replaced free, no questions." },
] as const;
