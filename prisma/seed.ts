/**
 * Demo seed: realistic catalog, users and orders for screenshots and local dev.
 * Run with: npx prisma db seed   (wired in package.json -> prisma.seed)
 */
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

const img = (seed: string) => ({
  publicId: `demo/${seed}`,
  url: `https://picsum.photos/seed/${seed}/900/900`,
});

interface ProductSeed {
  name: string;
  slug: string;
  description: string;
  category: string;
  featured?: boolean;
  imageSeeds: string[];
  variants: Array<{ name: string; sku: string; priceCents: number; stock: number; lowStockThreshold?: number }>;
}

const PRODUCTS: ProductSeed[] = [
  {
    name: "Heavyweight Crew Tee",
    slug: "heavyweight-crew-tee",
    description:
      "A 240gsm organic cotton tee with a boxy cut and reinforced collar. Pre-washed so it keeps its shape, and heavy enough to wear on its own three seasons of the year.",
    category: "apparel",
    featured: true,
    imageSeeds: ["crew-tee-1", "crew-tee-2", "crew-tee-3"],
    variants: [
      { name: "S / Black", sku: "TEE-BLK-S", priceCents: 3200, stock: 18 },
      { name: "M / Black", sku: "TEE-BLK-M", priceCents: 3200, stock: 24 },
      { name: "L / Black", sku: "TEE-BLK-L", priceCents: 3200, stock: 12 },
      { name: "XL / Black", sku: "TEE-BLK-XL", priceCents: 3200, stock: 3 },
    ],
  },
  {
    name: "Everyday Organic Hoodie",
    slug: "everyday-organic-hoodie",
    description:
      "Brushed-back fleece in certified organic cotton. Set-in sleeves, a double-lined hood and a kangaroo pocket that actually fits both hands. Cut to layer without bulk.",
    category: "apparel",
    imageSeeds: ["hoodie-1", "hoodie-2"],
    variants: [
      { name: "S / Slate", sku: "HOOD-SLT-S", priceCents: 6800, stock: 9 },
      { name: "M / Slate", sku: "HOOD-SLT-M", priceCents: 6800, stock: 14 },
      { name: "L / Slate", sku: "HOOD-SLT-L", priceCents: 6800, stock: 7 },
    ],
  },
  {
    name: "Recycled Wool Beanie",
    slug: "recycled-wool-beanie",
    description:
      "Knitted from 80% recycled merino with a deep double cuff. Warm without itch, structured without slouch — the one hat that survives every winter.",
    category: "accessories",
    imageSeeds: ["beanie-1"],
    variants: [
      { name: "One size / Charcoal", sku: "BEAN-CHR-OS", priceCents: 2400, stock: 30 },
      { name: "One size / Moss", sku: "BEAN-MOS-OS", priceCents: 2400, stock: 4 },
    ],
  },
  {
    name: "Canvas Market Tote",
    slug: "canvas-market-tote",
    description:
      "18oz waxed canvas with bartacked handles and an interior zip pocket. Carries a week of groceries or a laptop and a paperback — flat-packs when it doesn't.",
    category: "accessories",
    featured: true,
    imageSeeds: ["tote-1", "tote-2"],
    variants: [
      { name: "Natural", sku: "TOTE-NAT", priceCents: 2800, stock: 22 },
      { name: "Olive", sku: "TOTE-OLV", priceCents: 2800, stock: 11 },
    ],
  },
  {
    name: "Ceramic Pour-Over Mug",
    slug: "ceramic-pour-over-mug",
    description:
      "A 350ml stoneware mug glazed by hand, with a wide base that refuses to tip. Microwave and dishwasher safe; the speckle pattern means no two are identical.",
    category: "home-living",
    featured: true,
    imageSeeds: ["mug-1", "mug-2"],
    variants: [
      { name: "Speckled White", sku: "MUG-WHT", priceCents: 2200, stock: 36 },
      { name: "Midnight", sku: "MUG-MID", priceCents: 2200, stock: 2 },
    ],
  },
  {
    name: "Linen Throw Blanket",
    slug: "linen-throw-blanket",
    description:
      "Stonewashed European linen, 130×180cm, finished with a blanket stitch. Cool in summer, layered warmth in winter, and it gets softer with every wash.",
    category: "home-living",
    imageSeeds: ["throw-1"],
    variants: [
      { name: "Oat", sku: "THRW-OAT", priceCents: 8900, stock: 8 },
      { name: "Rust", sku: "THRW-RST", priceCents: 8900, stock: 5 },
    ],
  },
  {
    name: "Walnut Desk Organizer",
    slug: "walnut-desk-organizer",
    description:
      "Solid American walnut, oiled — never lacquered. Three compartments and a pen rail keep a desk honest. Each unit is cut from a single board so the grain runs through.",
    category: "home-living",
    imageSeeds: ["organizer-1", "organizer-2"],
    variants: [{ name: "Walnut", sku: "DESK-WAL", priceCents: 5400, stock: 10 }],
  },
  {
    name: "Insulated Steel Bottle 750ml",
    slug: "insulated-steel-bottle",
    description:
      "Double-wall vacuum insulation keeps drinks cold for 24 hours or hot for 12. Powder-coated 18/8 steel, a leakproof bamboo cap and a mouth wide enough for ice.",
    category: "accessories",
    imageSeeds: ["bottle-1"],
    variants: [
      { name: "Matte Black", sku: "BTL-BLK-750", priceCents: 3600, stock: 26 },
      { name: "Sage", sku: "BTL-SGE-750", priceCents: 3600, stock: 13 },
    ],
  },
  {
    name: "Dot-Grid Hardcover Notebook",
    slug: "dot-grid-hardcover-notebook",
    description:
      "192 pages of 120gsm paper that takes fountain pen ink without ghosting. Lay-flat binding, two ribbon markers and an expandable back pocket.",
    category: "stationery",
    imageSeeds: ["notebook-1", "notebook-2"],
    variants: [
      { name: "A5 / Graphite", sku: "NOTE-GRA-A5", priceCents: 1800, stock: 40 },
      { name: "A5 / Clay", sku: "NOTE-CLY-A5", priceCents: 1800, stock: 19 },
    ],
  },
  {
    name: "Machined Brass Pen",
    slug: "machined-brass-pen",
    description:
      "Turned from solid brass, weighted to write with no pressure at all. Takes standard Parker-style refills and develops a patina that maps how you use it.",
    category: "stationery",
    imageSeeds: ["pen-1"],
    variants: [{ name: "Raw Brass", sku: "PEN-BRS", priceCents: 2600, stock: 15 }],
  },
  {
    name: "Minimal Wall Print — A3",
    slug: "minimal-wall-print-a3",
    description:
      "Archival giclée print on 200gsm cotton-rag paper. Geometric studies in the same amber-on-charcoal palette as the rest of the collection. Frame not included.",
    category: "home-living",
    featured: true,
    imageSeeds: ["print-1", "print-2"],
    variants: [
      { name: "No. 01 — Arcs", sku: "PRNT-01-A3", priceCents: 3000, stock: 12 },
      { name: "No. 02 — Grid", sku: "PRNT-02-A3", priceCents: 3000, stock: 0 },
    ],
  },
  {
    name: "Recycled Five-Panel Cap",
    slug: "recycled-five-panel-cap",
    description:
      "A low-profile five-panel cut from recycled ripstop nylon with a brass slider closure. Packs flat, dries fast, and the brim keeps its line.",
    category: "apparel",
    imageSeeds: ["cap-1"],
    variants: [
      { name: "Black", sku: "CAP-BLK", priceCents: 3000, stock: 17 },
      { name: "Ecru", sku: "CAP-ECR", priceCents: 3000, stock: 6 },
    ],
  },
];

async function main() {
  console.log("Clearing existing data…");
  await prisma.processedStripeEvent.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating users…");
  const [admin, maya, jonas, priya] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Store Admin",
        email: "admin@atelier.test",
        passwordHash: hashSync("admin1234", 12),
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        name: "Maya Castillo",
        email: "maya@example.com",
        passwordHash: hashSync("customer1234", 12),
        role: "CUSTOMER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Jonas Weber",
        email: "jonas@example.com",
        passwordHash: hashSync("customer1234", 12),
        role: "CUSTOMER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Priya Sharma",
        email: "priya@example.com",
        passwordHash: hashSync("customer1234", 12),
        role: "CUSTOMER",
      },
    }),
  ]);
  void admin;

  console.log("Creating categories…");
  const categories = await Promise.all(
    [
      { name: "Apparel", slug: "apparel", description: "Cut to last — organic fabrics, honest weights." },
      { name: "Accessories", slug: "accessories", description: "The things you reach for every single day." },
      { name: "Home & Living", slug: "home-living", description: "Objects that earn their place on the shelf." },
      { name: "Stationery", slug: "stationery", description: "Paper and tools for people who still write." },
    ].map((category) => prisma.category.create({ data: category })),
  );
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  console.log("Creating products…");
  for (const seed of PRODUCTS) {
    const category = categoryBySlug.get(seed.category);
    if (!category) throw new Error(`Unknown category ${seed.category}`);
    await prisma.product.create({
      data: {
        name: seed.name,
        slug: seed.slug,
        description: seed.description,
        featured: seed.featured ?? false,
        categoryId: category.id,
        variants: { create: seed.variants },
        images: {
          create: seed.imageSeeds.map((imageSeed, index) => ({
            ...img(imageSeed),
            alt: seed.name,
            sortOrder: index,
          })),
        },
      },
    });
  }

  console.log("Creating demo orders…");
  const tee = await prisma.productVariant.findUniqueOrThrow({ where: { sku: "TEE-BLK-M" } });
  const mug = await prisma.productVariant.findUniqueOrThrow({ where: { sku: "MUG-WHT" } });
  const tote = await prisma.productVariant.findUniqueOrThrow({ where: { sku: "TOTE-NAT" } });
  const throwBlanket = await prisma.productVariant.findUniqueOrThrow({ where: { sku: "THRW-OAT" } });

  const ordersSeed = [
    {
      user: maya,
      status: "DELIVERED" as const,
      daysAgo: 21,
      lines: [
        { variant: tee, product: "Heavyweight Crew Tee", qty: 2 },
        { variant: mug, product: "Ceramic Pour-Over Mug", qty: 1 },
      ],
    },
    {
      user: jonas,
      status: "SHIPPED" as const,
      daysAgo: 4,
      lines: [{ variant: throwBlanket, product: "Linen Throw Blanket", qty: 1 }],
    },
    {
      user: priya,
      status: "PAID" as const,
      daysAgo: 1,
      lines: [
        { variant: tote, product: "Canvas Market Tote", qty: 1 },
        { variant: mug, product: "Ceramic Pour-Over Mug", qty: 2 },
      ],
    },
  ];

  for (const seed of ordersSeed) {
    const subtotal = seed.lines.reduce((sum, line) => sum + line.variant.priceCents * line.qty, 0);
    const shipping = subtotal >= 7500 ? 0 : 599;
    const createdAt = new Date(Date.now() - seed.daysAgo * 24 * 60 * 60 * 1000);

    const order = await prisma.order.create({
      data: {
        userId: seed.user.id,
        email: seed.user.email,
        status: seed.status,
        subtotalCents: subtotal,
        shippingCents: shipping,
        totalCents: subtotal + shipping,
        createdAt,
        items: {
          create: seed.lines.map((line) => ({
            variantId: line.variant.id,
            productName: line.product,
            variantName: line.variant.name,
            unitPriceCents: line.variant.priceCents,
            quantity: line.qty,
          })),
        },
      },
    });

    for (const line of seed.lines) {
      await prisma.inventoryLog.create({
        data: {
          variantId: line.variant.id,
          delta: -line.qty,
          kind: "SALE",
          reason: `Order #${order.number}`,
          orderId: order.id,
          createdAt,
        },
      });
    }
  }

  await prisma.inventoryLog.create({
    data: {
      variantId: mug.id,
      delta: 24,
      kind: "RESTOCK",
      reason: "Quarterly restock from supplier (by admin@atelier.test)",
    },
  });

  const counts = {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    orders: await prisma.order.count(),
  };
  console.log("Seed complete:", counts);
  console.log("Admin login:    admin@atelier.test / admin1234");
  console.log("Customer login: maya@example.com / customer1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
