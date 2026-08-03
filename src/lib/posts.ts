/**
 * Journal posts. Deliberately kept as data rather than a CMS — there are a
 * handful of articles a year and they change less often than the catalogue.
 * Move to MDX or the database if this ever grows past ~20 entries.
 */

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO
  readingMinutes: number;
  category: string;
  image: string;
  body: string[];
};

export const POSTS: Post[] = [
  {
    slug: "how-to-choose-a-rakhi",
    title: "How to choose a rakhi he will actually keep on",
    excerpt:
      "Most rakhis come off by lunchtime. A few practical things that decide whether yours survives the day.",
    date: "2026-07-20",
    readingMinutes: 4,
    category: "Buying guide",
    image: "/placeholders/banner-01.svg",
    body: [
      "There is a quiet truth about Raksha Bandhan that nobody says out loud: most rakhis are off the wrist by lunch. Not out of disrespect — they itch, they snag on shirt cuffs, or the thread is stiff enough to leave a mark.",
      "If you want yours to last past the photographs, the thread matters more than the stone. Silk and cotton-silk blends sit flat and soften with wear. Synthetic zari looks brilliant in a photo and feels like wire by evening.",
      "Match the piece to the life. Someone who types all day does not want a raised kundan cluster catching on a laptop edge — an oxidised nazar bead or a flat sterling motif works far better. For a brother who works outdoors, weight and durability beat delicacy.",
      "Consider what happens on the 10th. The rakhis people keep are the ones that stop looking like rakhis: a sterling Om that comes off the cord and becomes a pendant, a rudraksha that reads as a bracelet. A great many of our silver pieces are bought precisely for this reason.",
      "For children, ignore all of the above and buy the one that lights up. It will be worn for four days straight and then lost, which is exactly the correct outcome.",
      "Finally: buy the size down, not up. A rakhi that sits snug reads as jewellery. One that slides around reads as a party favour.",
    ],
  },
  {
    slug: "rakhi-gift-ideas-under-500",
    title: "Twelve rakhi gifts under ₹500 that do not feel cheap",
    excerpt:
      "A budget is not an excuse for a bad gift. What to look for — and what to avoid — at this price.",
    date: "2026-07-28",
    readingMinutes: 5,
    category: "Gift ideas",
    image: "/placeholders/banner-02.svg",
    body: [
      "Five hundred rupees buys a genuinely good rakhi. It does not buy a good rakhi and a good gift and a good box, which is where most people go wrong — they spread the budget thin and end up with three mediocre things instead of one nice one.",
      "At this price, spend on craft rather than material. A hand-worked meenakari peacock at ₹429 has perhaps an hour of a person's attention in it. A gold-plated piece with a bigger stone at the same price has almost none. You can see the difference across a table.",
      "Pearl work is the reliable value buy. Fresh-water pearls cost a fraction of what they look like they cost, and a three-row pearl cascade at ₹299 consistently gets asked about.",
      "Avoid anything described as 'American diamond' at this price. It is glass, which is fine, but glass set in soft alloy loses stones within a season. If you want sparkle, meenakari enamel holds up far better.",
      "If you are buying for a couple, the honest advice is to stretch. A bhaiya-bhabhi set at ₹549 does the work of two gifts, and the matched pair reads as far more considered than two separate ₹275 pieces.",
      "One thing worth paying for at any budget: the packaging. A rakhi handed over in a printed card with a tilak sachet feels finished. The same rakhi in a polybag does not, and the difference costs about thirty rupees.",
    ],
  },
  {
    slug: "the-story-behind-raksha-bandhan",
    title: "What the thread actually means",
    excerpt:
      "The history of Raksha Bandhan is older and stranger than the greeting-card version.",
    date: "2026-08-01",
    readingMinutes: 6,
    category: "Culture",
    image: "/placeholders/banner-05.svg",
    body: [
      "Ask most people what Raksha Bandhan commemorates and you will get a version involving a sister, a brother, and a promise of protection. That is true, but it is the most recent layer of a much older practice.",
      "The word raksha means protection and bandhan means bond, and for most of its history the thread was not specifically about siblings at all. Protective threads were tied by priests onto patrons, by wives onto husbands leaving for war, and by communities onto anyone heading into danger.",
      "The sibling framing grew dominant over the last few centuries, and it stuck because it filled a real gap. In a joint-family structure where a woman moved to her husband's household, the annual thread was a formal reassertion that her birth family remained hers — a claim, not just an affection.",
      "This is why the ceremony is oddly transactional in its structure: the tilak, the thread, the sweet, and then the gift. The gift is not payment. It is the brother visibly accepting the obligation in front of witnesses.",
      "It is also why the lumba exists. Tying a bangle-lumba onto the bhabhi acknowledges that the brother's obligation now runs through a household that includes her — a small, practical piece of family diplomacy encoded in jewellery.",
      "None of which is on your mind on the morning of, when you are trying to find parking and the good rakhis have sold out. But it is a decent thing to know while you are tying it.",
    ],
  },
  {
    slug: "caring-for-silver-rakhis",
    title: "Keeping a sterling rakhi from going black",
    excerpt:
      "Silver tarnishes. Here is how to slow it down, and how to fix it when it happens.",
    date: "2026-08-02",
    readingMinutes: 3,
    category: "Care",
    image: "/placeholders/banner-06.svg",
    body: [
      "Sterling silver is 92.5% silver and 7.5% copper, and it is the copper that misbehaves. Exposed to air and humidity — and Noida in August has plenty of both — it forms a dark layer on the surface. This is tarnish, not damage, and it comes off.",
      "The single most effective thing you can do is keep the piece in a closed bag when it is not being worn. Airtight beats decorative: a small zip pouch does more good than a velvet box with a gap in the lid.",
      "Skin contact actually helps. Silver worn regularly tarnishes far more slowly than silver in a drawer, because the natural oils keep the surface conditioned. The keepsake left untouched for eleven months is the one that goes black.",
      "To clean it: warm water, a drop of mild dish soap, and a soft toothbrush for the recesses. Dry it completely with a soft cloth. Do not use toothpaste, and do not use the foil-and-baking-soda trick on an oxidised piece — it strips the deliberate darkening out of the recesses and leaves the design looking flat.",
      "Keep it away from perfume, hair products and chlorine. Put the rakhi on last when getting ready, and take it off before a swim.",
      "If a piece has gone properly black after years in storage, any jeweller will re-polish it for very little. It is worth doing rather than replacing.",
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function sortedPosts(): Post[] {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
}
