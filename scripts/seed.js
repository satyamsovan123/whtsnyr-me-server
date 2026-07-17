import mongoose from "mongoose";
import { resolve } from "node:path";

// Load env before connecting
if (typeof process.loadEnvFile === "function") {
  for (const fileName of [".env.local", ".env"]) {
    try {
      process.loadEnvFile(resolve(process.cwd(), fileName));
    } catch {}
  }
}

import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { Area } from "../src/modules/catalog/area.model.js";
import { Place } from "../src/modules/catalog/place.model.js";
import { Event } from "../src/modules/catalog/event.model.js";
import { Merchant } from "../src/modules/catalog/merchant.model.js";
import { Specialty } from "../src/modules/specialties/specialty.model.js";
import { User } from "../src/modules/auth/user.model.js";

const isDryRun = process.argv.includes("--dry-run");
const isForce = process.argv.includes("--force");

async function runSeed() {
  console.log("🌱 Starting seed script for whtsnyr.me...");
  if (isDryRun) {
    console.log("⚠️ DRY RUN MODE: No data will be written to the database.");
  }

  await connectDatabase();

  try {
    let adminUser = await User.findOne({ roles: "ADMIN" });
    let adminId;
    if (!adminUser && !isDryRun) {
      console.log("Creating dummy admin user...");
      adminUser = await User.create({
        email: "admin@whtsnyr.me",
        emailCanonical: "admin@whtsnyr.me",
        passwordHash: "dummy",
        displayName: "System Admin",
        roles: ["ADMIN", "CURATOR"],
        status: "ACTIVE",
      });
    }
    adminId = adminUser ? adminUser._id : new mongoose.Types.ObjectId();

    if (isForce && !isDryRun) {
      console.log("🗑️ --force flag used. Dropping existing catalog collections...");
      await Area.deleteMany({});
      await Place.deleteMany({});
      await Event.deleteMany({});
      await Merchant.deleteMany({});
      await Specialty.deleteMany({});
    }

    const sourceRef = {
      url: "https://example.com/seed",
      sourceType: "CURATOR",
    };

    const commonData = {
      status: "PUBLISHED",
      lastVerifiedAt: new Date(),
      sourceRefs: [sourceRef],
      createdBy: adminId,
      updatedBy: adminId,
    };

    console.log("📍 Preparing Area data...");
    const areaData = {
      name: "ITER & Surroundings, Bhubaneswar",
      slug: "iter-bhubaneswar",
      city: "Bhubaneswar",
      state: "Odisha",
      country: "India",
      postalCodes: ["751030", "751024", "751019", "751002", "751014"],
      center: { type: "Point", coordinates: [85.7985, 20.2506] },
      description: "A vibrant educational and cultural hub featuring ancient temples, parks, and street food.",
      ...commonData,
    };

    let area;
    if (!isDryRun) {
      area = await Area.findOneAndUpdate({ slug: areaData.slug }, areaData, { upsert: true, new: true });
      console.log(`✅ Upserted Area: ${area.name}`);
    } else {
      area = { _id: new mongoose.Types.ObjectId(), name: areaData.name };
      console.log(`(Dry-run) Prepared Area: ${area.name}`);
    }

    console.log("🏛️ Preparing Places data...");
    const placesToSeed = [
      { name: "ITER (SOA University)", types: ["UNIVERSITY"], location: [85.7985, 20.2506], visitDurationMinutes: 60, priceBand: "FREE", summary: "Premier engineering college campus." },
      { name: "Khandagiri & Udayagiri Caves", types: ["HERITAGE"], location: [85.7757, 20.2562], visitDurationMinutes: 90, priceBand: "BUDGET", summary: "Ancient Jain rock-cut caves.", tags: ["history", "archaeology", "jain"], entryFeeMinor: 2500 },
      { name: "Lingaraj Temple", types: ["RELIGIOUS_SITE", "HERITAGE"], location: [85.8347, 20.2384], visitDurationMinutes: 60, priceBand: "FREE", summary: "Iconic 11th-century Shiva temple." },
      { name: "Rajarani Temple", types: ["HERITAGE"], location: [85.8397, 20.2435], visitDurationMinutes: 45, priceBand: "BUDGET", summary: "Known as the 'love temple', featuring intricate carvings." },
      { name: "Mukteshwar Temple", types: ["RELIGIOUS_SITE", "HERITAGE"], location: [85.8394, 20.2437], visitDurationMinutes: 30, priceBand: "FREE", summary: "10th-century temple known as the 'Gem of Odisha architecture'." },
      { name: "Parasurameswara Temple", types: ["RELIGIOUS_SITE"], location: [85.8346, 20.2440], visitDurationMinutes: 30, priceBand: "FREE", summary: "One of the oldest existing temples in Bhubaneswar." },
      { name: "Odisha State Museum", types: ["MUSEUM"], location: [85.8434, 20.2653], visitDurationMinutes: 90, priceBand: "BUDGET", summary: "Extensive collection of antiquities and art.", indoor: true },
      { name: "Tribal Museum", types: ["MUSEUM"], location: [85.8259, 20.2763], visitDurationMinutes: 60, priceBand: "BUDGET", summary: "Museum of tribal arts and artifacts.", indoor: true },
      { name: "Nandankanan Zoo", types: ["PARK", "NATURE", "ENTERTAINMENT"], location: [85.8239, 20.3955], visitDurationMinutes: 180, priceBand: "BUDGET", summary: "Zoological park and botanical garden famous for white tigers.", familyFriendly: true },
      { name: "Ekamra Kanan Botanical Garden", types: ["PARK", "NATURE"], location: [85.8303, 20.2803], visitDurationMinutes: 60, priceBand: "FREE", summary: "Large botanical garden with a rose garden and lake." },
      { name: "Dhauli Shanti Stupa", types: ["HERITAGE", "PHOTO_SPOT", "VIEWPOINT"], location: [85.8388, 20.2084], visitDurationMinutes: 60, priceBand: "FREE", summary: "Buddhist peace pagoda on the site of the Kalinga War." },
      { name: "Bindu Sagar Lake", types: ["NATURE", "PHOTO_SPOT"], location: [85.8342, 20.2406], visitDurationMinutes: 30, priceBand: "FREE", summary: "Sacred lake surrounded by historic temples." },
      { name: "Ekamra Haat", types: ["MARKET"], location: [85.8342, 20.2726], visitDurationMinutes: 60, priceBand: "FREE", summary: "Traditional market showcasing Odisha handicrafts." },
      { name: "Unit-1 Haat", types: ["MARKET"], location: [85.8406, 20.2705], visitDurationMinutes: 45, priceBand: "FREE", summary: "Bustling local market for fresh produce and goods." },
      { name: "Utkalika", types: ["LOCAL_SHOPPING"], location: [85.8212, 20.2857], visitDurationMinutes: 45, priceBand: "MODERATE", summary: "State emporium for authentic handlooms and handicrafts.", indoor: true },
      { name: "Nicco Park", types: ["ENTERTAINMENT"], location: [85.8199, 20.3033], visitDurationMinutes: 120, priceBand: "MODERATE", summary: "Amusement park with rides and attractions.", familyFriendly: true },
      { name: "Pathani Samanta Planetarium", types: ["ENTERTAINMENT", "MUSEUM"], location: [85.8239, 20.2843], visitDurationMinutes: 60, priceBand: "BUDGET", summary: "Planetarium with astronomy shows.", indoor: true, familyFriendly: true },
      { name: "Saheed Nagar Street Food", types: ["FOOD_STREET"], location: [85.8415, 20.2861], visitDurationMinutes: 45, priceBand: "BUDGET", summary: "Popular street food zone offering a variety of snacks." },
      { name: "Manek Pura Gali", types: ["FOOD_STREET"], location: [85.8299, 20.2530], visitDurationMinutes: 30, priceBand: "BUDGET", summary: "Local street food alley." },
      { name: "Ram Mandir", types: ["RELIGIOUS_SITE"], location: [85.8434, 20.2760], visitDurationMinutes: 30, priceBand: "FREE", summary: "Prominent Hindu temple complex." },
    ];

    for (const p of placesToSeed) {
      const placeData = {
        ...p,
        areaId: area._id,
        slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        location: { type: "Point", coordinates: p.location },
        ...commonData,
      };
      if (!isDryRun) {
        await Place.findOneAndUpdate({ slug: placeData.slug }, placeData, { upsert: true });
      }
    }
    console.log(`✅ Processed ${placesToSeed.length} Places.`);

    console.log("📅 Preparing Events data...");
    const nextYear = new Date().getFullYear() + 1;
    const eventsToSeed = [
      { name: "Rath Yatra", tags: ["RELIGIOUS_SITE"], startsAt: new Date(`${nextYear}-07-10T10:00:00Z`), endsAt: new Date(`${nextYear}-07-18T18:00:00Z`), summary: "Annual chariot festival.", location: [85.8347, 20.2384] },
      { name: "Durga Puja", startsAt: new Date(`${nextYear}-10-15T10:00:00Z`), endsAt: new Date(`${nextYear}-10-20T18:00:00Z`), summary: "Grand celebration with elaborate pandals.", location: [85.8415, 20.2861] },
      { name: "Adivasi Mela", startsAt: new Date(`${nextYear}-01-26T10:00:00Z`), endsAt: new Date(`${nextYear}-02-09T18:00:00Z`), summary: "Tribal fair showcasing indigenous culture.", location: [85.8342, 20.2726] },
      { name: "ITER TechFest", tags: ["UNIVERSITY"], startsAt: new Date(`${nextYear}-03-15T10:00:00Z`), endsAt: new Date(`${nextYear}-03-17T18:00:00Z`), summary: "Annual technical and cultural festival.", location: [85.7985, 20.2506] },
      { name: "Bali Yatra", startsAt: new Date(`${nextYear}-11-15T10:00:00Z`), endsAt: new Date(`${nextYear}-11-22T18:00:00Z`), summary: "Massive trade fair on the banks of Mahanadi.", location: [85.8753, 20.4625] },
    ];
    for (const e of eventsToSeed) {
      const eventData = {
        ...e,
        areaId: area._id,
        slug: e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        location: { type: "Point", coordinates: e.location },
        ...commonData,
      };
      if (!isDryRun) {
        await Event.findOneAndUpdate({ slug: eventData.slug }, eventData, { upsert: true });
      }
    }
    console.log(`✅ Processed ${eventsToSeed.length} Events.`);

    console.log("🛍️ Preparing Merchants data...");
    const merchantsToSeed = [
      { name: "Utkalika Handloom", categories: ["handloom"], location: [85.8212, 20.2857], summary: "State emporium for authentic handlooms." },
      { name: "Boyanika", categories: ["handloom"], location: [85.8350, 20.2730], summary: "Odisha State Handloom Weavers Coop." },
      { name: "Pipili Appliqué Workshop", categories: ["crafts"], location: [85.8342, 20.2726], summary: "Traditional appliqué work items." },
      { name: "Raghurajpur Pattachitra Studio", categories: ["art"], location: [85.8300, 20.2700], summary: "Authentic Pattachitra scroll paintings." },
      { name: "Kala Bhoomi Crafts Shop", categories: ["crafts"], location: [85.7894, 20.2458], summary: "Crafts shop attached to the museum." },
      { name: "Pahala Rasagola Shop", categories: ["sweets"], location: [85.8770, 20.3200], summary: "Famous spot for Odisha's rasagola." },
      { name: "Dhokra Craft Co-op", categories: ["crafts"], location: [85.8342, 20.2726], summary: "Metal casting crafts." },
      { name: "Tribal Art Gallery", categories: ["art"], location: [85.8259, 20.2763], summary: "Indigenous art gallery." },
    ];
    for (const m of merchantsToSeed) {
      const merchantData = {
        ...m,
        areaId: area._id,
        slug: m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        location: { type: "Point", coordinates: m.location },
        verificationStatus: "VERIFIED",
        fulfillmentModes: ["PICKUP"],
        ...commonData,
      };
      if (!isDryRun) {
        await Merchant.findOneAndUpdate({ slug: merchantData.slug }, merchantData, { upsert: true });
      }
    }
    console.log(`✅ Processed ${merchantsToSeed.length} Merchants.`);

    console.log("⭐ Preparing Specialties data...");
    const specialtiesToSeed = [
      { name: "Dalma", category: "DISH", swiggySearchQuery: "dalma", description: "Iconic Odia lentil-vegetable stew" },
      { name: "Chhena Poda", category: "DISH", swiggySearchQuery: "chhena poda", description: "Caramelized cottage cheese dessert" },
      { name: "Pahala Rasagola", category: "DISH", swiggySearchQuery: "rasagola", description: "Famous spongy sweet from Pahala" },
      { name: "Pakhala Bhata", category: "DISH", swiggySearchQuery: "pakhala", description: "Fermented rice dish, summer staple" },
      { name: "Mudhi Mansa", category: "DISH", swiggySearchQuery: "mutton mudhi", description: "Puffed rice with spicy mutton curry" },
      { name: "Pattachitra Painting", category: "CRAFT", description: "Traditional scroll painting on cloth" },
      { name: "Pipili Appliqué", category: "CRAFT", description: "Colorful fabric cut-work art" },
      { name: "Silver Filigree (Tarakasi)", category: "CRAFT", description: "Delicate silver wire jewelry" },
      { name: "Dhokra Metalwork", category: "CRAFT", description: "Lost-wax casting tribal art" },
      { name: "Temple Trail Walk", category: "EXPERIENCE", description: "Walking tour of 7th-century temples" },
      { name: "Kemiti Achha?", category: "PHRASE", description: "'How are you?' in Odia" },
    ];
    for (const s of specialtiesToSeed) {
      const specialtyData = {
        ...s,
        areaId: area._id,
        slug: s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        ...commonData,
      };
      if (!isDryRun) {
        await Specialty.findOneAndUpdate({ slug: specialtyData.slug }, specialtyData, { upsert: true });
      }
    }
    console.log(`✅ Processed ${specialtiesToSeed.length} Specialties.`);

    console.log("🎉 Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

runSeed();
