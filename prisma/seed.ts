import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Locally generated festive artwork (see scripts/generate-placeholders.mjs).
// These are stand-ins so nothing renders broken — replace each one with real
// product photography via Admin → Products → Edit.
const PLACEHOLDER_COUNT = 12;
const BANNER_COUNT = 6;

const pick = (i: number) =>
  `/placeholders/rakhi-${String((i % PLACEHOLDER_COUNT) + 1).padStart(2, "0")}.svg`;

const banner = (i: number) =>
  `/placeholders/banner-${String((i % BANNER_COUNT) + 1).padStart(2, "0")}.svg`;

type SeedProduct = {
  name: string;
  price: number; // rupees
  compareAt?: number;
  inventory: number;
  short: string;
  description: string;
  material: string;
  tags: string[];
  featured?: boolean;
};

const CATALOG: Record<string, { meta: { description: string; sort: number }; items: SeedProduct[] }> = {
  "Designer Rakhi": {
    meta: {
      description:
        "Hand-finished statement rakhis in kundan, meenakari and pearl work — for the brother who notices detail.",
      sort: 1,
    },
    items: [
      {
        name: "Kundan Royale Rakhi",
        price: 349,
        compareAt: 499,
        inventory: 40,
        short: "Uncut kundan stones set in a gold-plated brass frame.",
        description:
          "A centrepiece rakhi built around a cluster of uncut kundan stones, each hand-set into a gold-plated brass frame by artisans in Jaipur. The pearl-drop border catches light from every angle, and the woven silk thread is soft enough to wear all day. Presented on a printed card with a roli-chawal sachet and a mishri pouch.",
        material: "Gold-plated brass, kundan, fresh-water pearl, silk thread",
        tags: ["kundan", "premium", "handmade", "bestseller"],
        featured: true,
      },
      {
        name: "Meenakari Peacock Rakhi",
        price: 429,
        compareAt: 599,
        inventory: 25,
        short: "Enamel peacock motif in jewel-tone blues and greens.",
        description:
          "The peacock is painted in traditional meenakari enamel — layered, fired and polished so the blues stay vivid for years. A quiet nod to prosperity and grace, finished with a gold zari thread and two small ghungroo bells.",
        material: "Meenakari enamel on brass, zari thread",
        tags: ["meenakari", "peacock", "premium", "handmade"],
        featured: true,
      },
      {
        name: "Pearl Cascade Rakhi",
        price: 299,
        inventory: 55,
        short: "Layered fresh-water pearls on an ivory silk band.",
        description:
          "Three graduated rows of fresh-water pearls on an ivory silk band. Understated, light on the wrist, and the one people ask about. Comes with a matching pearl tilak for the ceremony.",
        material: "Fresh-water pearl, ivory silk",
        tags: ["pearl", "elegant", "lightweight"],
      },
      {
        name: "Evil Eye Protection Rakhi",
        price: 249,
        compareAt: 349,
        inventory: 70,
        short: "Turkish nazar bead framed in oxidised silver.",
        description:
          "A cobalt nazar bead framed in oxidised silver — the wish for protection, made literal. Modern enough to keep wearing well past Raksha Bandhan, which is rather the point.",
        material: "Oxidised silver-plate, glass nazar bead, cotton thread",
        tags: ["nazar", "protection", "modern", "unisex"],
      },
      {
        name: "Rudraksha Kalash Rakhi",
        price: 279,
        inventory: 45,
        short: "Five-mukhi rudraksha with a tiny brass kalash charm.",
        description:
          "A genuine five-mukhi rudraksha bead paired with a hand-turned brass kalash. Rooted, warm and deliberately simple — for brothers who prefer meaning over sparkle.",
        material: "Rudraksha, brass, jute-blend thread",
        tags: ["rudraksha", "spiritual", "traditional"],
      },
      {
        name: "Zardozi Thread Rakhi",
        price: 389,
        inventory: 30,
        short: "Raised zardozi embroidery in antique gold.",
        description:
          "Hand-embroidered zardozi in antique gold thread, worked over a padded silk base so the motif sits proud of the band. Each takes an artisan close to an hour.",
        material: "Zardozi metallic thread, silk",
        tags: ["zardozi", "handmade", "premium"],
      },
    ],
  },
  "Kids Rakhi": {
    meta: {
      description: "Bright, light and unbreakable — cartoon rakhis little brothers actually keep on.",
      sort: 2,
    },
    items: [
      {
        name: "Superhero Shield Rakhi",
        price: 149,
        compareAt: 199,
        inventory: 90,
        short: "Light-up shield motif on a stretchy band.",
        description:
          "A shield that lights up with a button press — powered by a replaceable coin cell that lasts the whole festival. The elastic band stretches to fit, so no knots and no tears.",
        material: "Food-safe ABS, elastic band, LED",
        tags: ["kids", "light-up", "superhero", "bestseller"],
        featured: true,
      },
      {
        name: "Cartoon Friends Rakhi (Set of 2)",
        price: 179,
        inventory: 80,
        short: "Two rakhis — because there is always a second brother.",
        description:
          "A pair of soft-resin cartoon rakhis on stretch bands. Sold as a set of two, which quietly solves the argument about who got the better one.",
        material: "Soft resin, elastic band",
        tags: ["kids", "set-of-2", "cartoon"],
      },
      {
        name: "Dinosaur Roar Rakhi",
        price: 159,
        inventory: 65,
        short: "Glow-in-the-dark T-rex for the small and loud.",
        description:
          "Charges in daylight, glows green after lights out. Waterproof, chew-resistant and rated for ages three and up.",
        material: "Phosphorescent resin, elastic band",
        tags: ["kids", "glow", "dinosaur"],
      },
      {
        name: "Unicorn Sparkle Rakhi",
        price: 169,
        inventory: 60,
        short: "Pastel unicorn with a soft glitter horn.",
        description:
          "Pastel pinks and lilacs with a sealed glitter horn — the glitter stays put, which parents appreciate more than children do.",
        material: "Resin, sealed glitter, elastic band",
        tags: ["kids", "unicorn", "glitter"],
      },
    ],
  },
  "Bhaiya Bhabhi Set": {
    meta: {
      description: "Matched lumba-and-rakhi pairs, boxed together for the couple.",
      sort: 3,
    },
    items: [
      {
        name: "Kundan Lumba Bhaiya-Bhabhi Set",
        price: 649,
        compareAt: 899,
        inventory: 35,
        short: "Matching kundan rakhi with a bangle lumba.",
        description:
          "A matched pair: a kundan rakhi for your brother and a bangle lumba for your bhabhi, worked in the same stone palette so they read as a set. Packed in a two-slot velvet box with both tilak sachets.",
        material: "Kundan, gold-plated brass, velvet cord",
        tags: ["bhaiya-bhabhi", "lumba", "set", "bestseller"],
        featured: true,
      },
      {
        name: "Pearl & Ruby Lumba Set",
        price: 749,
        inventory: 22,
        short: "Ruby-red stones with a triple pearl drop.",
        description:
          "Deep ruby stones with a triple fresh-water pearl drop on the lumba. The most-gifted set in the range, and the one that photographs best.",
        material: "Fresh-water pearl, glass ruby, brass",
        tags: ["bhaiya-bhabhi", "lumba", "pearl", "premium"],
      },
      {
        name: "Minimal Gold Couple Set",
        price: 549,
        inventory: 28,
        short: "Clean geometry, no stones, brushed gold finish.",
        description:
          "For couples who find traditional rakhis a bit much. Brushed gold-plate, geometric, no stones — quiet and modern, on charcoal silk cords.",
        material: "Brushed gold-plate on brass, silk cord",
        tags: ["bhaiya-bhabhi", "minimal", "modern", "set"],
      },
    ],
  },
  "Silver Rakhi": {
    meta: {
      description: "925 sterling silver rakhis, hallmarked — keepsakes, not one-day wear.",
      sort: 4,
    },
    items: [
      {
        name: "Sterling Silver Om Rakhi",
        price: 1299,
        compareAt: 1599,
        inventory: 18,
        short: "Hallmarked 925 silver Om on a maroon silk cord.",
        description:
          "A solid 925 sterling Om, hallmarked and hand-polished, on a maroon silk cord with an adjustable slip knot. Arrives in a lined keepsake box — this is the rakhi that gets kept in a drawer for years.",
        material: "925 sterling silver (hallmarked), silk cord",
        tags: ["silver", "925", "premium", "keepsake"],
        featured: true,
      },
      {
        name: "Silver Swastik Rakhi",
        price: 1149,
        inventory: 20,
        short: "Auspicious swastik in hallmarked sterling.",
        description:
          "A clean sterling swastik with a lightly hammered face that catches light without being loud. Comes with a certificate of purity.",
        material: "925 sterling silver, cotton-silk blend",
        tags: ["silver", "925", "traditional"],
      },
      {
        name: "Silver Ganesha Rakhi",
        price: 1449,
        inventory: 14,
        short: "Detailed Ganesha relief, oxidised finish.",
        description:
          "A finely cast Ganesha in oxidised sterling — the recesses darkened by hand so the relief reads clearly even at this size. Removable from the cord and wearable as a pendant afterwards.",
        material: "925 sterling silver, oxidised finish",
        tags: ["silver", "925", "ganesha", "keepsake"],
      },
    ],
  },
  "Rakhi Hampers": {
    meta: {
      description: "Rakhi, sweets and dry fruits in one box — the whole thali, delivered.",
      sort: 5,
    },
    items: [
      {
        name: "Celebration Hamper — Kaju Katli & Rakhi",
        price: 899,
        compareAt: 1199,
        inventory: 30,
        short: "250g kaju katli, designer rakhi, tilak kit.",
        description:
          "250g of fresh kaju katli from a Noida sweet house, a kundan designer rakhi, a roli-chawal tilak kit and a handwritten card in a rigid gift box. Sweets are boxed the morning of delivery.",
        material: "Rigid gift box, food-grade inner tray",
        tags: ["hamper", "sweets", "gift", "bestseller"],
        featured: true,
      },
      {
        name: "Dry Fruit Deluxe Hamper",
        price: 1299,
        inventory: 24,
        short: "400g almonds, cashews and pistachios with rakhi.",
        description:
          "Four compartments of premium almonds, cashews, pistachios and raisins — 400g total — with a silver-tone rakhi and tilak kit. The safe gift, done properly.",
        material: "Wooden partition box, sterling-tone rakhi",
        tags: ["hamper", "dry-fruits", "premium", "gift"],
      },
      {
        name: "Chocolate Indulgence Hamper",
        price: 749,
        inventory: 40,
        short: "Assorted imported chocolates with a kids rakhi.",
        description:
          "An assortment of imported chocolates paired with a bright kids rakhi. Built for younger brothers, and honest about it.",
        material: "Printed gift box",
        tags: ["hamper", "chocolate", "kids", "gift"],
      },
      {
        name: "Puja Thali Hamper",
        price: 1099,
        inventory: 20,
        short: "Brass thali, diya, rakhi and complete tilak set.",
        description:
          "An engraved brass puja thali with a matching diya, a designer rakhi, roli, chawal, mishri and a wick pack — everything the ceremony needs, so nothing gets improvised at the last minute.",
        material: "Engraved brass thali, brass diya",
        tags: ["hamper", "puja", "brass", "traditional"],
      },
    ],
  },
};

const REVIEWS = [
  { authorName: "Ananya Sharma", rating: 5, title: "Even better in person", body: "Ordered for my brother in Sector 78 and it reached the same evening. The stone work is far better than the photos suggest — he genuinely liked it." },
  { authorName: "Priya Verma", rating: 5, title: "Beautiful packaging", body: "The box, the tilak sachet, the card — everything felt considered. Will order from here again next year." },
  { authorName: "Rohit Malhotra", rating: 4, title: "Good quality", body: "Solid build and a comfortable thread. Took a day longer than expected but the seller kept me posted on WhatsApp." },
  { authorName: "Kavita Nair", rating: 5, title: "My bhabhi loved the lumba", body: "The set matched perfectly and looked much more expensive than it was. Delivery inside the society was quick and hassle-free." },
  { authorName: "Deepak Gupta", rating: 4, title: "Worth it", body: "The silver one is properly hallmarked. Slightly pricey but you can see where the money went." },
  { authorName: "Sneha Reddy", rating: 5, title: "Kids were thrilled", body: "The light-up rakhi was a huge hit with my nephew. He refused to take it off for three days." },
];

async function main() {
  console.log("🧹  Clearing existing data…");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.adminUser.deleteMany();

  const email = (process.env.ADMIN_EMAIL ?? "admin@rakhibazaar.in").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  await prisma.adminUser.create({
    data: {
      email,
      name: "Store Admin",
      passwordHash: await bcrypt.hash(password, 10),
      role: "admin",
    },
  });
  console.log(`👤  Admin created: ${email} / ${password}`);

  let imgIndex = 0;
  let productCount = 0;

  for (const [categoryName, { meta, items }] of Object.entries(CATALOG)) {
    const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const category = await prisma.category.create({
      data: {
        name: categoryName,
        slug,
        description: meta.description,
        imageUrl: banner(meta.sort - 1),
        sortOrder: meta.sort,
      },
    });

    for (const [i, item] of items.entries()) {
      const productSlug = item.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const product = await prisma.product.create({
        data: {
          name: item.name,
          slug: productSlug,
          description: item.description,
          shortDesc: item.short,
          price: item.price * 100,
          compareAtPrice: item.compareAt ? item.compareAt * 100 : null,
          sku: `RB-${slug.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
          inventory: item.inventory,
          tags: item.tags.join(","),
          material: item.material,
          isFeatured: item.featured ?? false,
          sortOrder: i,
          categoryId: category.id,
          images: {
            create: [0, 1, 2].map((n) => ({
              url: pick(imgIndex + n),
              alt: `${item.name} — view ${n + 1}`,
              sortOrder: n,
            })),
          },
        },
      });

      // Give roughly two-thirds of products a couple of reviews.
      if (imgIndex % 3 !== 2) {
        const a = REVIEWS[imgIndex % REVIEWS.length];
        const b = REVIEWS[(imgIndex + 2) % REVIEWS.length];
        await prisma.review.createMany({
          data: [
            { productId: product.id, ...a },
            { productId: product.id, ...b },
          ],
        });
      }

      imgIndex += 1;
      productCount += 1;
    }
  }

  console.log(`📦  ${productCount} products across ${Object.keys(CATALOG).length} categories`);

  // A couple of sample orders so the dashboard isn't empty on first run.
  const someProducts = await prisma.product.findMany({
    take: 4,
    include: { images: { take: 1 } },
  });

  const demoCustomers = [
    { name: "Meera Joshi", phone: "9810012345", email: "meera@example.com", tower: "Tower B", flat: "1204" },
    { name: "Arjun Sethi", phone: "9820098765", email: null, tower: "Tower D", flat: "0703" },
  ];

  for (const [i, c] of demoCustomers.entries()) {
    const customer = await prisma.customer.create({
      data: { name: c.name, phone: c.phone, email: c.email },
    });

    const chosen = someProducts.slice(i, i + 2);
    const items = chosen.map((p) => ({
      productId: p.id,
      nameSnapshot: p.name,
      imageSnapshot: p.images[0]?.url ?? null,
      unitPrice: p.price,
      quantity: 1,
      lineTotal: p.price,
    }));
    const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
    const shippingFee = subtotal >= 49900 ? 0 : 4900;

    await prisma.order.create({
      data: {
        orderNumber: `RB-2508-000${i + 1}`,
        customerId: customer.id,
        contactName: c.name,
        contactPhone: c.phone,
        contactEmail: c.email,
        addressLine1: "Amrapali Silicon City",
        tower: c.tower,
        flat: c.flat,
        landmark: "Near Sector 76 Metro",
        city: "Noida",
        state: "Uttar Pradesh",
        pincode: "201301",
        subtotal,
        shippingFee,
        total: subtotal + shippingFee,
        status: i === 0 ? "DELIVERED" : "PENDING",
        paymentStatus: i === 0 ? "PAID" : "PENDING",
        deliveredAt: i === 0 ? new Date() : null,
        items: { create: items },
      },
    });
  }

  console.log("🧾  2 sample orders created");
  console.log("✅  Seed complete");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
