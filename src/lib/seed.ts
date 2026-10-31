import type { Database } from "./db";
import { hashPassword } from "./password";

const TASHKENT_OFFSET_HOURS = 5;

/** Builds an ISO timestamp for a given Tashkent wall-clock time. */
function atTashkent(daysFromNow: number, hour: number, minute = 0): string {
  const shifted = new Date(Date.now() + TASHKENT_OFFSET_HOURS * 3_600_000);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth();
  const d = shifted.getUTCDate();
  const utc = Date.UTC(y, m, d + daysFromNow, hour, minute) - TASHKENT_OFFSET_HOURS * 3_600_000;
  return new Date(utc).toISOString();
}

function inHours(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

const CATEGORIES = [
  { slug: "sport", name: "Sport", color: "#F97316", icon: "ball", kind: "event", sort: 1 },
  { slug: "it-talim", name: "IT va ta'lim", color: "#3B82F6", icon: "code", kind: "event", sort: 2 },
  { slug: "madaniyat", name: "Madaniyat", color: "#A855F7", icon: "music", kind: "event", sort: 3 },
  { slug: "volontyorlik", name: "Volontyorlik", color: "#22C55E", icon: "heart", kind: "event", sort: 4 },
  { slug: "musobaqa", name: "Musobaqa", color: "#EF4444", icon: "trophy", kind: "event", sort: 5 },
  { slug: "karyera", name: "Karyera", color: "#DB2777", icon: "briefcase", kind: "event", sort: 6 },
  { slug: "yoshlar-markazi", name: "Yoshlar markazi", color: "#0F766E", icon: "users", kind: "place", sort: 1 },
  { slug: "it-markaz", name: "IT markaz", color: "#0369A1", icon: "monitor", kind: "place", sort: 2 },
  { slug: "kutubxona", name: "Kutubxona", color: "#7C3AED", icon: "book", kind: "place", sort: 3 },
  { slug: "sport-inshoot", name: "Sport inshooti", color: "#EA580C", icon: "ball", kind: "place", sort: 4 },
  { slug: "bandlik", name: "Bandlik markazi", color: "#4D7C0F", icon: "briefcase", kind: "place", sort: 5 },
  { slug: "dam-olish", name: "Dam olish", color: "#059669", icon: "tree", kind: "place", sort: 6 },
];

interface SeedEvent {
  slug: string;
  title: string;
  description: string;
  category: string;
  lat: number;
  lng: number;
  venue: string;
  address: string;
  startsAt: string;
  endsAt: string | null;
  organizer: string;
  isFree: number;
  price: string | null;
  capacity: number;
  registered: number;
}

interface SeedPlace {
  slug: string;
  name: string;
  description: string;
  category: string;
  lat: number;
  lng: number;
  address: string;
  workingHours: string | null;
  phone: string | null;
  url: string | null;
}

const EVENTS: SeedEvent[] = [
  {
    slug: "yoshlar-forumi-2026",
    title: "Yunusobod yoshlar forumi",
    description:
      "Tumandagi eng katta yoshlar forumi. Bir kunda 20 dan ortiq mahorat darsi, taniqli mehmonlar bilan suhbatlar, ish va ta'lim imkoniyatlari yarmarkasi. O'z g'oyangizni taqdim etib, grant yutib olish imkoniyatiga ega bo'ling.",
    category: "karyera",
    lat: 41.3595,
    lng: 69.2885,
    venue: "Yunusobod yoshlar markazi",
    address: "Ahmad Donish ko'chasi, 12",
    startsAt: atTashkent(3, 10, 0),
    endsAt: atTashkent(3, 17, 0),
    organizer: "Yunusobod tumani hokimligi",
    isFree: 1,
    price: null,
    capacity: 400,
    registered: 268,
  },
  {
    slug: "street-football-cup",
    title: "Street Football Cup",
    description:
      "3x3 formatidagi ko'cha futboli turniri. 16 jamoa, hakamlar, sovrinlar va DJ set. Terma jamoa futbolchilari bilan uchrashuv ham bor. Ro'yxatdan o'tish jamoalar uchun ochiq.",
    category: "sport",
    lat: 41.352,
    lng: 69.297,
    venue: "Yunusobod sport majmuasi",
    address: "Shifokorlar ko'chasi, 22",
    startsAt: atTashkent(2, 16, 0),
    endsAt: atTashkent(2, 19, 0),
    organizer: "Yunusobod sport boshqarmasi",
    isFree: 1,
    price: null,
    capacity: 120,
    registered: 84,
  },
  {
    slug: "ai-startup-weekend",
    title: "AI & Startup Weekend",
    description:
      "48 soat ichida g'oyadan prototipgacha. Mentorlar, investorlar va IT Park jamoasi bilan ishlash imkoniyati. Eng yaxshi 3 loyiha grant va akseleratsiya dasturiga yo'llanma oladi.",
    category: "it-talim",
    lat: 41.358,
    lng: 69.301,
    venue: "IT Park Yunusobod filiali",
    address: "Bog'ishamol ko'chasi, 45",
    startsAt: atTashkent(6, 9, 30),
    endsAt: atTashkent(7, 18, 0),
    organizer: "IT Park Uzbekistan",
    isFree: 1,
    price: null,
    capacity: 150,
    registered: 117,
  },
  {
    slug: "robototexnika-musobaqasi",
    title: "Robototexnika musobaqasi",
    description:
      "Maktab va kollej o'quvchilari uchun robototexnika bellashuvi. Line follower, sumo va kreativ loyihalar yo'nalishlari. G'oliblar respublika bosqichiga yo'llanma oladi.",
    category: "musobaqa",
    lat: 41.371,
    lng: 69.298,
    venue: "Yoshlar texnoparki",
    address: "Yunusobod ko'chasi, 4",
    startsAt: atTashkent(9, 11, 0),
    endsAt: atTashkent(9, 16, 0),
    organizer: "Yoshlar ishlari agentligi",
    isFree: 1,
    price: null,
    capacity: 80,
    registered: 61,
  },
  {
    slug: "akustik-kechqurun",
    title: "Akustik kechqurun",
    description:
      "Ochiq osmon ostida jonli musiqa kechasi. Mahalliy yosh ijrochilar, akustik guruhlar va she'riyat burchagi. Kirish bepul, o'rindiqlar cheklangan.",
    category: "madaniyat",
    lat: 41.335,
    lng: 69.279,
    venue: "Oqtepa bog'i amfiteatri",
    address: "Oqtepa ko'chasi, 1",
    startsAt: atTashkent(4, 18, 30),
    endsAt: atTashkent(4, 21, 0),
    organizer: "Toshkent shahar yoshlar markazi",
    isFree: 1,
    price: null,
    capacity: 250,
    registered: 132,
  },
  {
    slug: "volontyorlar-kuni",
    title: "Volontyorlar kuni",
    description:
      "Oqtepa bog'ida ko'chat ekish va hududni obodonlashtirish aksiyasi. Ishtirokchilarga inventar, suv va tushlik beriladi. Volontyorlik daftarchasi ochiladi.",
    category: "volontyorlik",
    lat: 41.3338,
    lng: 69.281,
    venue: "Oqtepa bog'i",
    address: "Oqtepa ko'chasi, 3",
    startsAt: atTashkent(7, 8, 30),
    endsAt: atTashkent(7, 13, 0),
    organizer: "Yunusobod volontyorlar harakati",
    isFree: 1,
    price: null,
    capacity: 200,
    registered: 74,
  },
  {
    slug: "karyera-yarmarkasi",
    title: "Karyera yarmarkasi",
    description:
      "50 dan ortiq kompaniya vakillari, 300+ bo'sh ish o'rni va amaliyot dasturlari. CV tayyorlash burchagi, suhbatga tayyorlov masterklasslari va bepul fotosessiya.",
    category: "karyera",
    lat: 41.345,
    lng: 69.285,
    venue: "Yunusobod bandlik markazi",
    address: "Chinor ko'chasi, 8",
    startsAt: atTashkent(12, 10, 0),
    endsAt: atTashkent(12, 16, 0),
    organizer: "Bandlik va mehnat munosabatlari markazi",
    isFree: 1,
    price: null,
    capacity: 500,
    registered: 221,
  },
  {
    slug: "shaxmat-blits-turniri",
    title: "Shaxmat blits-turniri",
    description:
      "10+5 taym-kontrolida blits shaxmat turniri. 9 tur, shveytsar tizimi. G'oliblar pul mukofoti va kubok bilan taqdirlanadi. Boshlovchilar uchun alohida guruh.",
    category: "musobaqa",
    lat: 41.363,
    lng: 69.305,
    venue: "Toshkent shahar yoshlar kutubxonasi",
    address: "Zulfiyaxonim ko'chasi, 3",
    startsAt: atTashkent(5, 15, 0),
    endsAt: atTashkent(5, 19, 0),
    organizer: "Yunusobod shaxmat federatsiyasi",
    isFree: 1,
    price: null,
    capacity: 64,
    registered: 47,
  },
  {
    slug: "dizayn-brending-masterklass",
    title: "Dizayn va brending masterklassi",
    description:
      "Mahalliy brendlar uchun identifikatsiya yaratish bo'yicha amaliy masterklass. Figma'da jonli ishlash, portfolio bo'yicha maslahatlar va mijoz bilan ishlash sirlari.",
    category: "it-talim",
    lat: 41.35,
    lng: 69.304,
    venue: "Startup Hub coworking",
    address: "Amir Temur shoh ko'chasi, 108",
    startsAt: atTashkent(8, 14, 0),
    endsAt: atTashkent(8, 18, 0),
    organizer: "Navqiron dizayn jamoasi",
    isFree: 0,
    price: "50 000 so'm",
    capacity: 40,
    registered: 31,
  },
  {
    slug: "boks-ochiq-ring",
    title: "Boks bo'yicha ochiq ring",
    description:
      "Bodomzor sport zalida ochiq ring. Boshlovchilar uchun texnika darsi, tajribalilar uchun sparring. Himoya jihozlari joyida beriladi, ishtirok bepul.",
    category: "sport",
    lat: 41.3415,
    lng: 69.274,
    venue: "Bodomzor sport zali",
    address: "Bodomzor yo'li, 17",
    startsAt: atTashkent(10, 17, 0),
    endsAt: atTashkent(10, 20, 0),
    organizer: "Boks federatsiyasi Yunusobod bo'limi",
    isFree: 1,
    price: null,
    capacity: 60,
    registered: 38,
  },
  {
    slug: "kitob-muhokamasi",
    title: "Kitob muhokamasi: «O'tkan kunlar»",
    description:
      "Abdulla Qodiriyning «O'tkan kunlar» romani bo'yicha ochiq muhokama. Moderator — mahalliy yozuvchi. Eng faol ishtirokchilarga kitob sovg'a qilinadi.",
    category: "madaniyat",
    lat: 41.36,
    lng: 69.284,
    venue: "Yunusobod 4-mavze kutubxonasi",
    address: "Yunusobod ko'chasi, 42",
    startsAt: inHours(3),
    endsAt: inHours(4.5),
    organizer: "Yoshlar kitob klubi",
    isFree: 1,
    price: null,
    capacity: 50,
    registered: 42,
  },
  {
    slug: "grant-pitch",
    title: "Yoshlar tashabbuslari uchun grant pitch",
    description:
      "5 daqiqalik pitch sessiyasi: g'oyangizni investorlar va hokimlik vakillariga taqdim eting. 3 ta eng yaxshi loyiha 10 million so'mgacha grant oladi.",
    category: "karyera",
    lat: 41.3475,
    lng: 69.2925,
    venue: "Yunusobod biznes markazi",
    address: "Ahmad Donish ko'chasi, 30",
    startsAt: atTashkent(14, 10, 0),
    endsAt: atTashkent(14, 13, 0),
    organizer: "Yoshlar ishlari agentligi",
    isFree: 1,
    price: null,
    capacity: 100,
    registered: 66,
  },
];

const PLACES: SeedPlace[] = [
  {
    slug: "yunusobod-yoshlar-markazi",
    name: "Yunusobod yoshlar markazi",
    description:
      "Bepul mashg'ulotlar, coworking, psixolog maslahatlari va loyihalar uchun maydon. Har hafta yangi kurslar va klub uchrashuvlari.",
    category: "yoshlar-markazi",
    lat: 41.3595,
    lng: 69.2885,
    address: "Ahmad Donish ko'chasi, 12",
    workingHours: "09:00 – 20:00 (Dush–Shan)",
    phone: "+998 71 200 00 01",
    url: null,
  },
  {
    slug: "it-park-yunusobod",
    name: "IT Park Yunusobod filiali",
    description:
      "Dasturlash, dizayn va startap inkubatsiyasi. Bepul seminar va mentorlik sessiyalari, ingliz tili klublari.",
    category: "it-markaz",
    lat: 41.358,
    lng: 69.301,
    address: "Bog'ishamol ko'chasi, 45",
    workingHours: "09:00 – 21:00",
    phone: "+998 71 200 00 02",
    url: null,
  },
  {
    slug: "bandlik-markazi",
    name: "Yunusobod bandlik markazi",
    description:
      "Ish qidiruvchilar uchun vakansiyalar bazasi, CV tayyorlash va kasb yo'naltirish xizmatlari. Yoshlar uchun alohida maslahat stoli.",
    category: "bandlik",
    lat: 41.345,
    lng: 69.285,
    address: "Chinor ko'chasi, 8",
    workingHours: "09:00 – 18:00 (Dush–Juma)",
    phone: "+998 71 200 00 03",
    url: null,
  },
  {
    slug: "yoshlar-kutubxonasi",
    name: "Toshkent shahar yoshlar kutubxonasi",
    description:
      "20 000+ kitob fondi, coworking zali, bepul Wi-Fi va har hafta kitob klubi uchrashuvlari. IELTS va matematika to'garaklari.",
    category: "kutubxona",
    lat: 41.363,
    lng: 69.305,
    address: "Zulfiyaxonim ko'chasi, 3",
    workingHours: "08:00 – 19:00",
    phone: "+998 71 200 00 04",
    url: null,
  },
  {
    slug: "bodomzor-sport-majmuasi",
    name: "Bodomzor sport majmuasi",
    description:
      "Yopiq zal, boks va kurash zallari, fitnes. Yoshlar uchun chegirmali abonementlar va bepul sinov mashg'ulotlari.",
    category: "sport-inshoot",
    lat: 41.3415,
    lng: 69.274,
    address: "Bodomzor yo'li, 17",
    workingHours: "07:00 – 22:00",
    phone: "+998 71 200 00 05",
    url: null,
  },
  {
    slug: "oqtepa-bogi",
    name: "Oqtepa istirohat bog'i",
    description:
      "Sayr, ochiq mashg'ulotlar va volontyorlik aksiyalari uchun sevimli maskan. Yozda kino kechalari va yugurish klubi.",
    category: "dam-olish",
    lat: 41.3345,
    lng: 69.28,
    address: "Oqtepa ko'chasi, 1",
    workingHours: "24/7",
    phone: null,
    url: null,
  },
  {
    slug: "startup-hub",
    name: "Startup Hub coworking",
    description:
      "Startap jamoalari uchun coworking: 24/7 kirish, meeting xonalari, investor uchrashuvlari va demo day maydonchasi.",
    category: "it-markaz",
    lat: 41.35,
    lng: 69.304,
    address: "Amir Temur shoh ko'chasi, 108",
    workingHours: "24/7",
    phone: "+998 71 200 00 06",
    url: null,
  },
  {
    slug: "yunusobod-yoshlar-klubi",
    name: "Yunusobod 4-mavze yoshlar klubi",
    description:
      "Mahalla yoshlari uchun bepul to'garaklar: shaxmat, rasm, vokal va debat. Har shanba mahalla uchrashuvlari.",
    category: "yoshlar-markazi",
    lat: 41.367,
    lng: 69.286,
    address: "Yunusobod ko'chasi, 42",
    workingHours: "10:00 – 19:00",
    phone: null,
    url: null,
  },
];

const MALE_FIRST = [
  "Aziz", "Javohir", "Bekzod", "Sardor", "Islom", "Temur", "Alisher",
  "Rustam", "Jasur", "Otabek", "Doniyor", "Ulug'bek", "Mirjalol", "Jahongir",
];
const MALE_LAST = [
  "Karimov", "Rahimov", "Saidov", "Nazarov", "Ergashev", "Tursunov",
  "Rasulov", "Bekmurodov", "Sobirov", "Umarov", "To'rayev", "Yo'ldoshev",
];
const FEMALE_FIRST = [
  "Malika", "Nilufar", "Zilola", "Dilnoza", "Shahzoda", "Gulnoza", "Madina",
  "Sevinch", "Kamola", "Zarina", "Feruza", "Dildora", "Go'zal", "Maftuna",
];
const FEMALE_LAST = [
  "Yusupova", "Abdullayeva", "Islomova", "Qodirova", "Xolmatova", "Sattorova",
  "Nurmatova", "Alimova", "Jalolova", "Mirzayeva", "Xasanova", "Aripova",
];

const q = (value: string | number | null): string =>
  value === null ? "NULL" : typeof value === "number" ? String(value) : `'${value.replace(/'/g, "''")}'`;

/** Fills the registrations table so admin lists match the seeded counts. */
function registrationStatements(): string[] {
  const statements: string[] = [];
  let seq = 0;
  for (const event of EVENTS) {
    for (let i = 0; i < event.registered; i++) {
      const male = seq % 2 === 0;
      const first = male
        ? MALE_FIRST[(seq * 7) % MALE_FIRST.length]
        : FEMALE_FIRST[(seq * 5) % FEMALE_FIRST.length];
      const last = male
        ? MALE_LAST[(seq * 11) % MALE_LAST.length]
        : FEMALE_LAST[(seq * 13) % FEMALE_LAST.length];
      const phone = `+99890${7_000_000 + seq}`;
      const createdAt = new Date(
        Date.now() - ((seq * 53) % (12 * 24)) * 3_600_000,
      ).toISOString();
      statements.push(
        `INSERT OR IGNORE INTO registrations (event_id, name, phone, created_at)
         VALUES ((SELECT id FROM events WHERE slug = ${q(event.slug)}), ${q(`${first} ${last}`)}, ${q(phone)}, ${q(createdAt)});`,
      );
      seq += 1;
    }
  }
  return statements;
}

export async function seedDatabase(db: Database): Promise<void> {
  await fetchAdminSeed(db);
  const existing = await db.get("SELECT COUNT(*) AS c FROM events");
  if (Number(existing?.c ?? 0) > 0) return;

  const now = new Date().toISOString();
  const statements: string[] = [];
  for (const category of CATEGORIES) {
    statements.push(
      `INSERT OR IGNORE INTO categories (slug, name, color, icon, kind, sort)
       VALUES (${q(category.slug)}, ${q(category.name)}, ${q(category.color)}, ${q(category.icon)}, ${q(category.kind)}, ${category.sort});`,
    );
  }
  for (const event of EVENTS) {
    statements.push(
      `INSERT INTO events
        (slug, title, description, category_id, lat, lng, venue, address, starts_at, ends_at,
         organizer, is_free, price, capacity, registered, status, created_at, updated_at)
       VALUES (${q(event.slug)}, ${q(event.title)}, ${q(event.description)},
         (SELECT id FROM categories WHERE slug = ${q(event.category)}),
         ${event.lat}, ${event.lng}, ${q(event.venue)}, ${q(event.address)},
         ${q(event.startsAt)}, ${q(event.endsAt)}, ${q(event.organizer)}, ${event.isFree},
         ${q(event.price)}, ${event.capacity}, ${event.registered}, 'published', ${q(now)}, ${q(now)});`,
    );
  }
  for (const place of PLACES) {
    statements.push(
      `INSERT INTO places
        (slug, name, description, category_id, lat, lng, address, working_hours, phone, url,
         status, created_at, updated_at)
       VALUES (${q(place.slug)}, ${q(place.name)}, ${q(place.description)},
         (SELECT id FROM categories WHERE slug = ${q(place.category)}),
         ${place.lat}, ${place.lng}, ${q(place.address)}, ${q(place.workingHours)},
         ${q(place.phone)}, ${q(place.url)}, 'published', ${q(now)}, ${q(now)});`,
    );
  }
  statements.push(...registrationStatements());
  try {
    await db.batch(statements);
  } catch (error) {
    // Another cold instance may have seeded concurrently; treat that as success.
    const check = await db.get("SELECT COUNT(*) AS c FROM events");
    if (Number(check?.c ?? 0) === 0) throw error;
  }
}

async function fetchAdminSeed(db: Database): Promise<void> {
  const row = await db.get("SELECT COUNT(*) AS c FROM admins");
  if (Number(row?.c ?? 0) > 0) return;
  await db.run(
    "INSERT INTO admins (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)",
    "admin@navqiron.uz",
    hashPassword("navqiron2026"),
    "Navqiron administratori",
    new Date().toISOString(),
  );
}
