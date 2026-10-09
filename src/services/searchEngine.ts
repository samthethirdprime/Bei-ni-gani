import { Product, SearchQueryAnalysis, VendorPrice } from '../types';
import { matchesStrictLocation } from './locationService';
import { connectorRegistry } from './connectors/connectorRegistry';
import { GroupedProductComparison } from './connectors/types';

// Comprehensive Worldwide & Kenyan locations dictionary
export const WORLDWIDE_LOCATIONS: { [key: string]: { country: string; county: string; town?: string } } = {
  // Kenyan Hubs & 47 Counties
  'rongai': { country: 'Kenya', county: 'Kajiado', town: 'Ongata Rongai' },
  'ongata rongai': { country: 'Kenya', county: 'Kajiado', town: 'Ongata Rongai' },
  'nairobi': { country: 'Kenya', county: 'Nairobi', town: 'Nairobi' },
  'mombasa': { country: 'Kenya', county: 'Mombasa', town: 'Mombasa' },
  'kisumu': { country: 'Kenya', county: 'Kisumu', town: 'Kisumu' },
  'nakuru': { country: 'Kenya', county: 'Nakuru', town: 'Nakuru' },
  'eldoret': { country: 'Kenya', county: 'Uasin Gishu', town: 'Eldoret' },
  'thika': { country: 'Kenya', county: 'Kiambu', town: 'Thika' },
  'kiambu': { country: 'Kenya', county: 'Kiambu', town: 'Kiambu' },
  'ruaka': { country: 'Kenya', county: 'Kiambu', town: 'Ruaka' },
  'ruiru': { country: 'Kenya', county: 'Kiambu', town: 'Ruiru' },
  'machakos': { country: 'Kenya', county: 'Machakos', town: 'Machakos' },
  'naivasha': { country: 'Kenya', county: 'Nakuru', town: 'Naivasha' },
  'ngong': { country: 'Kenya', county: 'Kajiado', town: 'Ngong' },
  'kitengela': { country: 'Kenya', county: 'Kajiado', town: 'Kitengela' },
  'syokimau': { country: 'Kenya', county: 'Machakos', town: 'Syokimau' },
  'eastleigh': { country: 'Kenya', county: 'Nairobi', town: 'Eastleigh' },
  'westlands': { country: 'Kenya', county: 'Nairobi', town: 'Westlands' },
  'karen': { country: 'Kenya', county: 'Nairobi', town: 'Karen' },
  'kasarani': { country: 'Kenya', county: 'Nairobi', town: 'Kasarani' },
  'roysambu': { country: 'Kenya', county: 'Nairobi', town: 'Roysambu' },
  'kilimani': { country: 'Kenya', county: 'Nairobi', town: 'Kilimani' },
  'south b': { country: 'Kenya', county: 'Nairobi', town: 'South B' },
  'south c': { country: 'Kenya', county: 'Nairobi', town: 'South C' },
  'pipeline': { country: 'Kenya', county: 'Nairobi', town: 'Pipeline' },
  'donholm': { country: 'Kenya', county: 'Nairobi', town: 'Donholm' },
  'kayole': { country: 'Kenya', county: 'Nairobi', town: 'Kayole' },
  'githurai': { country: 'Kenya', county: 'Nairobi', town: 'Githurai' },
  'kahawa': { country: 'Kenya', county: 'Nairobi', town: 'Kahawa' },
  'kahawa west': { country: 'Kenya', county: 'Nairobi', town: 'Kahawa West' },
  'umoja': { country: 'Kenya', county: 'Nairobi', town: 'Umoja' },
  'buruburu': { country: 'Kenya', county: 'Nairobi', town: 'Buruburu' },
  'nyali': { country: 'Kenya', county: 'Mombasa', town: 'Nyali' },
  'bamburi': { country: 'Kenya', county: 'Mombasa', town: 'Bamburi' },
  'mtwapa': { country: 'Kenya', county: 'Kilifi', town: 'Mtwapa' },
  'diani': { country: 'Kenya', county: 'Kwale', town: 'Diani' },
  'kondele': { country: 'Kenya', county: 'Kisumu', town: 'Kondele' },
  'nyeri': { country: 'Kenya', county: 'Nyeri', town: 'Nyeri' },
  'meru': { country: 'Kenya', county: 'Meru', town: 'Meru' },
  'kakamega': { country: 'Kenya', county: 'Kakamega', town: 'Kakamega' },
  'kericho': { country: 'Kenya', county: 'Kericho', town: 'Kericho' },
  'kisii': { country: 'Kenya', county: 'Kisii', town: 'Kisii' },
  'garissa': { country: 'Kenya', county: 'Garissa', town: 'Garissa' },
  'kilifi': { country: 'Kenya', county: 'Kilifi', town: 'Kilifi' },

  // Worldwide Hubs
  'los angeles': { country: 'United States', county: 'California', town: 'Los Angeles' },
  'la': { country: 'United States', county: 'California', town: 'Los Angeles' },
  'california': { country: 'United States', county: 'California', town: 'California' },
  'new york': { country: 'United States', county: 'New York', town: 'New York City' },
  'nyc': { country: 'United States', county: 'New York', town: 'New York City' },
  'manhattan': { country: 'United States', county: 'New York', town: 'Manhattan' },
  'brooklyn': { country: 'United States', county: 'New York', town: 'Brooklyn' },
  'texas': { country: 'United States', county: 'Texas', town: 'Houston' },
  'houston': { country: 'United States', county: 'Texas', town: 'Houston' },
  'miami': { country: 'United States', county: 'Florida', town: 'Miami' },
  'chicago': { country: 'United States', county: 'Illinois', town: 'Chicago' },
  'london': { country: 'United Kingdom', county: 'England', town: 'London' },
  'manchester': { country: 'United Kingdom', county: 'England', town: 'Manchester' },
  'birmingham': { country: 'United Kingdom', county: 'England', town: 'Birmingham' },
  'lagos': { country: 'Nigeria', county: 'Lagos State', town: 'Lagos' },
  'abuja': { country: 'Nigeria', county: 'Abuja FCT', town: 'Abuja' },
  'ikeja': { country: 'Nigeria', county: 'Lagos State', town: 'Ikeja' },
  'johannesburg': { country: 'South Africa', county: 'Gauteng', town: 'Johannesburg' },
  'sandton': { country: 'South Africa', county: 'Gauteng', town: 'Sandton' },
  'cape town': { country: 'South Africa', county: 'Western Cape', town: 'Cape Town' },
  'toronto': { country: 'Canada', county: 'Ontario', town: 'Toronto' },
  'vancouver': { country: 'Canada', county: 'British Columbia', town: 'Vancouver' },
  'sydney': { country: 'Australia', county: 'New South Wales', town: 'Sydney' },
  'melbourne': { country: 'Australia', county: 'Victoria', town: 'Melbourne' },
  'dubai': { country: 'United Arab Emirates', county: 'Dubai', town: 'Dubai' },
  'kampala': { country: 'Uganda', county: 'Central', town: 'Kampala' },
  'dar es salaam': { country: 'Tanzania', county: 'Dar es Salaam', town: 'Dar es Salaam' },
  'kigali': { country: 'Rwanda', county: 'Kigali City', town: 'Kigali' }
};

export const KENYAN_LOCATIONS = WORLDWIDE_LOCATIONS;

// Kenyan and English Natural Language query inquiry prefixes
const QUERY_PREFIXES = [
  /^how\s+much\s+is\s+(the\s+|a\s+|an\s+)?/i,
  /^how\s+much\s+does\s+(a\s+|an\s+)?/i,
  /^what\s+is\s+the\s+price\s+of\s+(a\s+|an\s+)?/i,
  /^what\s+is\s+the\s+cost\s+of\s+(a\s+|an\s+)?/i,
  /^what\s+does\s+(a\s+|an\s+)?/i,
  /^price\s+of\s+(a\s+|an\s+)?/i,
  /^cost\s+of\s+(a\s+|an\s+)?/i,
  /^bei\s+ya\s+/i,
  /^bei\s+gani\s+(ya\s+)?/i,
  /^ni\s+bei\s+gani\s+(ya\s+)?/i,
  /^ni\s+how\s+much\s+(is\s+)?/i,
  /^pesa\s+ngapi\s+(ya\s+)?/i,
  /^tell\s+me\s+price\s+of\s+/i,
  /^check\s+bei\s+ya\s+/i,
  /^rate\s+of\s+/i
];

const QUERY_SUFFIXES = [
  /\s+price$/i,
  /\s+cost$/i,
  /\s+bei$/i,
  /\s+bei\s+gani\??$/i,
  /\s+ni\s+how\s+much\??$/i,
  /\s+ni\s+pesa\s+ngapi\??$/i,
  /\s+refill$/i,
  /\s+refill\s+price$/i
];

// Clean search term
export function cleanQuery(query: string): string {
  if (!query) return '';
  return query
    .toLowerCase()
    .replace(/[?!,.:;()"\-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Canonical everyday Kenyan concepts, synonyms, categories, and subcategories
export interface ConceptMapping {
  canonicalName: string;
  category: string;
  subcategory: string;
  swahiliName: string;
  unit: string;
  aliases: string[];
  discriminators?: string[]; // words that MUST NOT trigger collision with unrelated products
}

export const CANONICAL_CONCEPTS: ConceptMapping[] = [
  // CLOTHING & FASHION
  {
    canonicalName: 'Underwear / Innerwear (Boxers & Briefs)',
    category: 'clothing',
    subcategory: 'Underwear & Innerwear',
    swahiliName: 'Suruali ya Ndani / Boxers',
    unit: 'piece / 3-pack',
    aliases: ['underwear', 'under wear', 'innerwear', 'inner wear', 'boxers', 'boxer', 'panties', 'panty', 'briefs', 'kamisi', 'shupavu', 'suruali ya ndani', 'nguo za ndani']
  },
  {
    canonicalName: 'Handkerchiefs (Cotton Pocket Hankies)',
    category: 'clothing',
    subcategory: 'Accessories',
    swahiliName: 'Kitambaa cha Mfukoni / Leso',
    unit: '6-pack / piece',
    aliases: ['handkerchief', 'handkerchiefs', 'hanky', 'hankies', 'kitambaa cha mfukoni', 'kitambaa', 'leso ya mfuko']
  },
  {
    canonicalName: 'Cotton Socks',
    category: 'clothing',
    subcategory: 'Hosiery & Socks',
    swahiliName: 'Soksi za Pamba',
    unit: '3-pair pack',
    aliases: ['socks', 'sock', 'soksi', 'stockings', 'ankle socks', 'sports socks']
  },
  {
    canonicalName: 'Shoe Laces & Care',
    category: 'footwear',
    subcategory: 'Shoe Accessories',
    swahiliName: 'Kamba za Viatu & Kiwi',
    unit: 'pair',
    aliases: ['laces', 'shoe laces', 'shoelaces', 'kamba za viatu', 'kiwi', 'shoe polish', 'insoles']
  },
  {
    canonicalName: 'Eyewear & Glasses',
    category: 'clothing',
    subcategory: 'Eyewear & Glasses',
    swahiliName: 'Miwani ya Macho',
    unit: 'piece',
    aliases: ['glasses', 'spectacles', 'sunglasses', 'reading glasses', 'miwani', 'eyewear', 'sun glasses']
  },
  // HOUSEHOLD & CLEANING
  {
    canonicalName: 'Cooking Gas (LPG Cylinders & Refills)',
    category: 'household',
    subcategory: 'Cooking Gas & LPG',
    swahiliName: 'Mtungi wa Gas / Gas Refill',
    unit: '6kg / 13kg refill',
    aliases: ['gas', 'lpg', 'cooking gas', 'gas refill', 'gas cylinder', 'mtungi wa gas', 'k-gas', 'total gas', 'rubis gas', 'afrigas', '6kg gas', '13kg gas']
  },
  {
    canonicalName: 'Air Humidifier & Diffuser',
    category: 'household',
    subcategory: 'Appliances & Air Quality',
    swahiliName: 'Mashine ya Humidifier',
    unit: 'piece',
    aliases: ['humidifier', 'humidifiers', 'air humidifier', 'diffuser', 'aroma diffuser', 'room humidifier', 'air purifier']
  },
  {
    canonicalName: 'Bedsheets & Pillowcases',
    category: 'household',
    subcategory: 'Bedding & Linens',
    swahiliName: 'Mashuka ya Kitanda',
    unit: '4-piece set',
    aliases: ['bedsheets', 'bed sheets', 'bedsheet', 'mashuka', 'shuka', 'pillowcases', 'blanket', 'duvet', 'blankets']
  },
  {
    canonicalName: 'Bathing & Laundry Bar Soap',
    category: 'household',
    subcategory: 'Soaps & Detergents',
    swahiliName: 'Sabuni ya Kuoga & Kufua',
    unit: 'bar / 800g',
    aliases: ['soap', 'sabuni', 'bathing soap', 'bar soap', 'menengai', 'geisha', 'dettol', 'omo', 'aerial', 'detergent', 'sabuni ya kipande']
  },
  {
    canonicalName: 'Toothpaste & Oral Care',
    category: 'household',
    subcategory: 'Personal & Oral Care',
    swahiliName: 'Dawa ya Meno',
    unit: '140g tube',
    aliases: ['toothpaste', 'tooth paste', 'dawa ya meno', 'colgate', 'sensodyne', 'toothbrush', 'brush ya meno']
  },
  // FURNITURE
  {
    canonicalName: 'Shoe Rack / Stand',
    category: 'furniture',
    subcategory: 'Storage & Organizers',
    swahiliName: 'Rack ya Viatu',
    unit: 'piece',
    aliases: ['shoe rack', 'shoerack', 'rack ya viatu', 'shoe stand', 'kabati ya viatu', 'shelf ya viatu'],
    discriminators: ['rack', 'stand', 'shelf', 'storage', 'cabinet']
  },
  {
    canonicalName: 'High Density Foam Mattress',
    category: 'furniture',
    subcategory: 'Mattresses & Beds',
    swahiliName: 'Godoro la Kulala',
    unit: '6x6 / 5x6 piece',
    aliases: ['mattress', 'godoro', 'bobmil', 'superfoam', 'mouka', 'foam mattress', 'bed mattress', 'godoro 6x6', 'godoro 5x6']
  },
  // FITNESS & SPORTS
  {
    canonicalName: 'Workout Equipment & Gym Stuff',
    category: 'fitness',
    subcategory: 'Gym & Fitness Equipment',
    swahiliName: 'Vifaa vya Gym & Mazoezi',
    unit: 'set / pair',
    aliases: ['workout equipment', 'gym stuff', 'gym equipment', 'fitness equipment', 'vifaa vya gym', 'vifaa vya mazoezi']
  },
  {
    canonicalName: 'Dumbbells & Weights',
    category: 'fitness',
    subcategory: 'Gym & Fitness Equipment',
    swahiliName: 'Dumbbells za Mazoezi',
    unit: 'pair / per kg',
    aliases: ['dumbbells', 'dumbbell', 'weights', 'hex dumbbells', 'hand weights', 'kettlebell']
  },
  {
    canonicalName: 'Resistance Bands & Loop Sets',
    category: 'fitness',
    subcategory: 'Gym & Fitness Equipment',
    swahiliName: 'Resistance Bands',
    unit: '5-pack set',
    aliases: ['resistance bands', 'resistance band', 'exercise bands', 'workout bands', 'loop bands', 'pull up bands']
  },
  // ELECTRONICS
  {
    canonicalName: 'Phone Charger & USB Cables',
    category: 'electronics',
    subcategory: 'Mobile Accessories',
    swahiliName: 'Chaja ya Simu',
    unit: 'piece',
    aliases: ['phone charger', 'charger', 'usb cable', 'type c cable', 'lightning cable', 'fast charger', 'chaja', 'chaja ya simu']
  },
  {
    canonicalName: 'Power Bank (Portable Battery Charger)',
    category: 'electronics',
    subcategory: 'Mobile Accessories & Power',
    swahiliName: 'Power Bank / Chaja ya Kubeba',
    unit: 'piece',
    aliases: ['power bank', 'powerbank', 'portable charger', 'battery pack', 'portable power bank', 'power banks']
  },
  {
    canonicalName: 'Headphones & Wireless Audio',
    category: 'electronics',
    subcategory: 'Audio & Headphones',
    swahiliName: 'Headphones / Vifaa vya Masikio',
    unit: 'pair / piece',
    aliases: ['headphones', 'headphone', 'headset', 'earphones', 'earbuds', 'wireless headphones', 'airpods']
  },
  {
    canonicalName: 'TV Stand & Media Consoles',
    category: 'furniture',
    subcategory: 'Living Room & TV Units',
    swahiliName: 'Meza ya TV / Stand ya TV',
    unit: 'piece',
    aliases: ['tv stand', 'tvstand', 'tv unit', 'television stand', 'tv console', 'entertainment unit', 'tv cabinet']
  },
  {
    canonicalName: 'Duvet & Bedding Comforters',
    category: 'household',
    subcategory: 'Bedding & Linens',
    swahiliName: 'Duvet ya Kitanda / Blanketi',
    unit: 'piece',
    aliases: ['duvet', 'duvets', 'comforter', 'comforters', 'quilt', 'quilts', 'all seasons duvet', 'microfiber duvet']
  },
  {
    canonicalName: 'Adult Wellness & Personal Massagers (Dildos)',
    category: 'personal_care',
    subcategory: 'Adult Wellness',
    swahiliName: 'Vifaa vya Afya ya Kibinafsi (Adult Wellness)',
    unit: 'piece',
    aliases: ['dildo', 'dildos', 'personal massager', 'vibrator', 'adult toy', 'adult wellness', 'silicone massager', 'sex toy']
  },
  // GROCERIES & COMMODITIES
  {
    canonicalName: 'Fresh Sweet Watermelon',
    category: 'groceries',
    subcategory: 'Fruits & Vegetables',
    swahiliName: 'Tikitimaji / Tikiti Maji',
    unit: 'kg / piece',
    aliases: ['watermelon', 'water melon', 'tikiti', 'tikitimaji', 'tikiti maji'],
    discriminators: ['melon', 'tikiti', 'watermelon'] // MUST NOT collide with bottled water
  },
  {
    canonicalName: 'White Cane Sugar',
    category: 'groceries',
    subcategory: 'Pantry & Essentials',
    swahiliName: 'Sukari Nyeupe',
    unit: '1 kg / 2 kg',
    aliases: ['sugar', 'sukari', 'white sugar', 'kabras', 'mumias', 'sukari ya chai', 'sukari 1kg', 'sukari 2kg']
  },
  {
    canonicalName: 'Fresh Beef (Steak / Bone)',
    category: 'groceries',
    subcategory: 'Meat & Butchery',
    swahiliName: 'Nyama ya Ng\'ombe',
    unit: '1 kg',
    aliases: ['meat', 'nyama', 'beef', "nyama ya ng'ombe", 'nyama ya ngombe', 'steak', 'nyama choma']
  },
  {
    canonicalName: 'Whole Dressed Chicken',
    category: 'groceries',
    subcategory: 'Poultry',
    swahiliName: 'Kuku Mzima (Broiler / Kienyeji)',
    unit: 'bird / kg',
    aliases: ['chicken', 'kuku', 'broiler', 'kienyeji', 'kuku kienyeji', 'kuku mzima', 'poultry']
  },
  // BUILDING & HARDWARE
  {
    canonicalName: 'Portland Cement (50kg Bag)',
    category: 'hardware',
    subcategory: 'Building Materials',
    swahiliName: 'Simiti (Mfuko wa 50kg)',
    unit: '50kg bag',
    aliases: ['cement', 'simiti', 'bamburi', 'tembo cement', 'blue triangle', 'simiti 50kg', 'mfuko wa simiti']
  },
  // SERVICES
  {
    canonicalName: 'Barber & Kinyozi Haircut',
    category: 'services',
    subcategory: 'Grooming & Hair',
    swahiliName: 'Kinyozi / Kunyoa Nywele',
    unit: 'cut / session',
    aliases: ['barber', 'kinyozi', 'haircut', 'kunyoa', 'shave', 'salon', 'kinyozi haircut']
  },
  {
    canonicalName: 'Plumber & Pipe Repair (Fundi wa Maji)',
    category: 'services',
    subcategory: 'Plumbing & Repairs',
    swahiliName: 'Fundi wa Maji & Mabomba',
    unit: 'call-out / job',
    aliases: ['plumber', 'fundi wa maji', 'fundi bomba', 'plumbing', 'bomba', 'water pipe repair']
  },
  {
    canonicalName: 'Electrician & Wiring (Fundi wa Stima)',
    category: 'services',
    subcategory: 'Electrical & Wiring',
    swahiliName: 'Fundi wa Stima & Umeme',
    unit: 'call-out / point',
    aliases: ['electrician', 'fundi wa stima', 'fundi stima', 'wiring', 'electrical repair', 'fundi umeme', 'stima']
  },
  {
    canonicalName: 'Car Wash & Detailing',
    category: 'services',
    subcategory: 'Automotive Services',
    swahiliName: 'Kuosha Gari',
    unit: 'vehicle / wash',
    aliases: ['car wash', 'kuosha gari', 'carwash', 'auto wash', 'cleaning car']
  }
];

// Base Product Definitions for Universal Variant Matching
export interface BaseProductVariant {
  key: string;
  name: string;
  aliases: string[];
}

export interface BaseProductDef {
  key: string;
  name: string;
  category: string;
  subcategory: string;
  aliases: string[];
  variants: BaseProductVariant[];
}

export const BASE_PRODUCTS: BaseProductDef[] = [
  {
    key: 'sugar',
    name: 'Sugar (Sukari)',
    category: 'groceries',
    subcategory: 'Pantry Staples',
    aliases: ['sugar', 'sukari', 'white sugar', 'brown sugar', 'raw sugar', 'sukari ya chai', 'demerara'],
    variants: [
      { key: 'white', name: 'White Sugar', aliases: ['white', 'nyeupe', 'white sugar', 'sukari nyeupe'] },
      { key: 'brown', name: 'Brown Sugar', aliases: ['brown', 'golden', 'brown sugar', 'sukari ya brown', 'sukari brown'] },
      { key: 'raw', name: 'Raw / Demerara Sugar', aliases: ['raw', 'demerara', 'organic', 'unrefined', 'asilia'] },
      { key: 'icing', name: 'Icing Sugar', aliases: ['icing', 'confectioners'] }
    ]
  },
  {
    key: 'rice',
    name: 'Rice (Mchele)',
    category: 'groceries',
    subcategory: 'Rice & Grains',
    aliases: ['rice', 'mchele', 'basmati', 'pishori', 'sindano', 'biryani rice'],
    variants: [
      { key: 'pishori', name: 'Pishori Rice', aliases: ['pishori', 'mwea', 'mwea pishori'] },
      { key: 'basmati', name: 'Basmati Rice', aliases: ['basmati', 'daawat basmati'] },
      { key: 'sindano', name: 'Sindano Rice', aliases: ['sindano', 'white rice', 'long grain'] },
      { key: 'brown', name: 'Brown Rice', aliases: ['brown rice', 'brown basmati'] }
    ]
  },
  {
    key: 'milk',
    name: 'Milk (Maziwa)',
    category: 'groceries',
    subcategory: 'Dairy & Milk',
    aliases: ['milk', 'maziwa', 'fresh milk', 'uht milk', 'mala', 'lala'],
    variants: [
      { key: 'fresh', name: 'Fresh Milk', aliases: ['fresh', 'safi', 'pouch', 'fresh milk', 'maziwa safi'] },
      { key: 'uht', name: 'UHT Long Life', aliases: ['uht', 'long life', 'carton', 'sanduku'] },
      { key: 'mala', name: 'Mala / Lala', aliases: ['mala', 'lala', 'fermented', 'maziwa lala'] },
      { key: 'lowfat', name: 'Low Fat / Skimmed', aliases: ['low fat', 'skimmed', 'light'] }
    ]
  },
  {
    key: 'shoes',
    name: 'Shoes (Viatu)',
    category: 'footwear',
    subcategory: 'Shoes & Footwear',
    aliases: ['shoes', 'viatu', 'sneakers', 'school shoes', 'loafers', 'boots', 'toughees', 'raba'],
    variants: [
      { key: 'school', name: 'School Shoes', aliases: ['school', 'toughees', 'viatu vya shule', 'shule'] },
      { key: 'loafers', name: 'Formal Loafers', aliases: ['loafers', 'formal', 'official', 'leather shoes', 'dress shoes'] },
      { key: 'sneakers', name: 'Sneakers', aliases: ['sneakers', 'sneaker', 'canvas', 'raba', 'casual'] },
      { key: 'boots', name: 'Boots', aliases: ['boots', 'safari boots', 'boot'] }
    ]
  },
  {
    key: 'boxers',
    name: 'Underwear / Boxers',
    category: 'clothing',
    subcategory: 'Underwear & Innerwear',
    aliases: ['boxers', 'boxer', 'underwear', 'panties', 'panty', 'innerwear', 'briefs', 'suruali ya ndani', 'nguo za ndani'],
    variants: [
      { key: 'boxers', name: 'Boxers', aliases: ['boxers', 'boxer'] },
      { key: 'panties', name: 'Panties', aliases: ['panties', 'panty'] },
      { key: 'briefs', name: 'Briefs', aliases: ['briefs', 'kamisi'] }
    ]
  },
  {
    key: 'gas',
    name: 'Cooking Gas (LPG)',
    category: 'household',
    subcategory: 'Cooking Gas & LPG',
    aliases: ['gas', 'lpg', 'cooking gas', 'gesi', 'mtungi wa gas', 'gas refill'],
    variants: [
      { key: 'refill', name: 'Gas Refill', aliases: ['refill', 'kujaza', 'gas refill'] },
      { key: 'complete', name: 'Complete Cylinder', aliases: ['complete', 'cylinder', 'mtungi kamili', 'new cylinder'] }
    ]
  },
  {
    key: 'watermelon',
    name: 'Watermelon (Tikitimaji)',
    category: 'groceries',
    subcategory: 'Fruits & Vegetables',
    aliases: ['watermelon', 'water melon', 'tikiti', 'tikitimaji', 'tikiti maji'],
    variants: []
  },
  {
    key: 'power_bank',
    name: 'Power Bank (Portable Charger)',
    category: 'electronics',
    subcategory: 'Mobile Accessories & Power',
    aliases: ['power bank', 'powerbank', 'portable charger', 'battery pack', 'portable power bank'],
    variants: []
  },
  {
    key: 'tv_stand',
    name: 'TV Stand & Media Consoles',
    category: 'furniture',
    subcategory: 'Living Room & TV Units',
    aliases: ['tv stand', 'tvstand', 'tv unit', 'television stand', 'tv console', 'entertainment unit', 'tv cabinet'],
    variants: []
  },
  {
    key: 'headphones',
    name: 'Headphones & Wireless Audio',
    category: 'electronics',
    subcategory: 'Audio & Headphones',
    aliases: ['headphones', 'headphone', 'headset', 'earphones', 'earbuds', 'wireless headphones', 'airpods'],
    variants: []
  },
  {
    key: 'duvet',
    name: 'Duvet & Bedding Comforters',
    category: 'household',
    subcategory: 'Bedding & Linens',
    aliases: ['duvet', 'duvets', 'comforter', 'comforters', 'quilt', 'quilts', 'all seasons duvet', 'microfiber duvet'],
    variants: []
  },
  {
    key: 'shoe_rack',
    name: 'Shoe Rack & Organizers',
    category: 'furniture',
    subcategory: 'Storage & Organizers',
    aliases: ['shoe rack', 'shoerack', 'shoe stand', 'shoe organizer', 'shoe cabinet', 'rack ya viatu'],
    variants: []
  },
  {
    key: 'socks',
    name: 'Socks & Hosiery',
    category: 'clothing',
    subcategory: 'Hosiery & Socks',
    aliases: ['socks', 'sock', 'soksi', 'stockings', 'ankle socks', 'cotton socks', 'crew socks'],
    variants: []
  },
  {
    key: 'dildo',
    name: 'Adult Wellness & Personal Massagers (Dildos)',
    category: 'personal_care',
    subcategory: 'Adult Wellness',
    aliases: ['dildo', 'dildos', 'personal massager', 'vibrator', 'adult toy', 'adult wellness', 'silicone massager', 'sex toy'],
    variants: []
  },
  {
    key: 'flour',
    name: 'Flour (Unga)',
    category: 'groceries',
    subcategory: 'Pantry Staples',
    aliases: ['flour', 'unga', 'maize flour', 'wheat flour', 'unga wa ugali', 'unga wa ngano'],
    variants: [
      { key: 'maize', name: 'Maize Meal (Ugali)', aliases: ['maize', 'ugali', 'mahindi', 'sifted'] },
      { key: 'wheat', name: 'Wheat Flour (Ngano)', aliases: ['wheat', 'ngano', 'all purpose', 'chapo', 'mandazi'] },
      { key: 'atta', name: 'Atta Whole Wheat', aliases: ['atta', 'brown wheat', 'whole wheat'] }
    ]
  },
  {
    key: 'oil',
    name: 'Cooking Oil (Mafuta ya Kupikia)',
    category: 'groceries',
    subcategory: 'Pantry Staples',
    aliases: ['cooking oil', 'mafuta ya kupikia', 'oil', 'mafuta', 'vegetable oil'],
    variants: [
      { key: 'liquid', name: 'Vegetable Oil', aliases: ['vegetable', 'liquid', 'fresh fri', 'rina', 'elianto'] },
      { key: 'solid', name: 'Solid Cooking Fat', aliases: ['solid', 'fat', 'kimbo', 'kasuku', 'cowboy'] }
    ]
  },
  {
    key: 'bread',
    name: 'Bread (Mkate)',
    category: 'groceries',
    subcategory: 'Bakery',
    aliases: ['bread', 'mkate', 'supaloaf', 'broadways', 'festive'],
    variants: [
      { key: 'white', name: 'White Bread', aliases: ['white', 'white bread', 'mkate mweupe'] },
      { key: 'brown', name: 'Brown Bread', aliases: ['brown', 'brown bread', 'wholemeal'] }
    ]
  },
  {
    key: 'chicken',
    name: 'Chicken (Kuku)',
    category: 'groceries',
    subcategory: 'Poultry',
    aliases: ['chicken', 'kuku', 'poultry'],
    variants: [
      { key: 'broiler', name: 'Broiler Chicken', aliases: ['broiler', 'dressed'] },
      { key: 'kienyeji', name: 'Kienyeji Local Chicken', aliases: ['kienyeji', 'kienyeji kuku', 'indigenous'] }
    ]
  },
  {
    key: 'beef',
    name: 'Beef (Nyama ya Ng\'ombe)',
    category: 'groceries',
    subcategory: 'Meat & Butchery',
    aliases: ['beef', 'nyama', 'meat', "nyama ya ng'ombe", 'nyama ya ngombe', 'steak'],
    variants: [
      { key: 'steak', name: 'Boneless Steak', aliases: ['steak', 'boneless'] },
      { key: 'bone', name: 'Beef with Bone', aliases: ['with bone', 'bone', 't-bone'] }
    ]
  },
  {
    key: 'smartphones',
    name: 'Smartphones (Simu)',
    category: 'electronics',
    subcategory: 'Smartphones',
    aliases: ['smartphone', 'smartphones', 'phone', 'simu', 'samsung', 'iphone', 'tecno', 'infinix', 'oppo', 'redmi'],
    variants: [
      { key: 'a56', name: 'Galaxy A56', aliases: ['a56', 'galaxy a56'] },
      { key: 'a36', name: 'Galaxy A36', aliases: ['a36', 'galaxy a36'] },
      { key: 'a55', name: 'Galaxy A55', aliases: ['a55', 'galaxy a55'] },
      { key: 'case', name: 'Phone Case / Cover', aliases: ['case', 'cover', 'screen protector'] }
    ]
  },
  {
    key: 'bedsitters',
    name: 'Bedsitters & Studios',
    category: 'housing',
    subcategory: 'Residential Rentals',
    aliases: ['bedsitter', 'bedsitters', 'studio apartment', 'chumba', 'rental', 'single room'],
    variants: []
  },
  {
    key: 'barber',
    name: 'Barber & Kinyozi',
    category: 'services',
    subcategory: 'Grooming & Hair',
    aliases: ['barber', 'kinyozi', 'haircut', 'kunyoa', 'shave'],
    variants: []
  },
  {
    key: 'plumber',
    name: 'Plumber & Pipe Repair',
    category: 'services',
    subcategory: 'Plumbing & Repairs',
    aliases: ['plumber', 'fundi wa maji', 'fundi bomba', 'bomba'],
    variants: []
  },
  {
    key: 'electrician',
    name: 'Electrician & Wiring',
    category: 'services',
    subcategory: 'Electrical & Wiring',
    aliases: ['electrician', 'fundi wa stima', 'fundi stima', 'stima'],
    variants: []
  },
  {
    key: 'dumbbells',
    name: 'Dumbbells & Weights',
    category: 'fitness',
    subcategory: 'Free Weights',
    aliases: ['dumbbells', 'dumbbell', 'weights', 'hex dumbbells', 'hand weights', 'adjustable dumbbells'],
    variants: [
      { key: '10kg', name: '10kg Dumbbells', aliases: ['10kg', '10 kg'] },
      { key: '5kg', name: '5kg Dumbbells', aliases: ['5kg', '5 kg'] },
      { key: '15kg', name: '15kg Dumbbells', aliases: ['15kg', '15 kg'] },
      { key: '20kg', name: '20kg Dumbbells', aliases: ['20kg', '20 kg'] },
      { key: 'adjustable', name: 'Adjustable Dumbbells', aliases: ['adjustable', 'dial'] }
    ]
  },
  {
    key: 'treadmill',
    name: 'Treadmills & Cardio',
    category: 'fitness',
    subcategory: 'Cardio Machines',
    aliases: ['treadmill', 'treadmills', 'running machine', 'mashine ya kukimbia', 'running treadmill'],
    variants: [
      { key: 'motorized', name: 'Motorized Treadmill', aliases: ['motorized', 'electric'] },
      { key: 'manual', name: 'Manual Curved Treadmill', aliases: ['manual', 'curved'] }
    ]
  },
  {
    key: 'resistance_bands',
    name: 'Resistance Bands',
    category: 'fitness',
    subcategory: 'Resistance Training',
    aliases: ['resistance bands', 'resistance band', 'exercise bands', 'workout bands', 'loop bands'],
    variants: []
  },
  {
    key: 'pullup_bar',
    name: 'Pull-Up & Chin-Up Bars',
    category: 'fitness',
    subcategory: 'Calisthenics',
    aliases: ['pull up bar', 'pullup bar', 'chin up bar', 'doorway pull up bar'],
    variants: []
  },
  {
    key: 'yoga_mat',
    name: 'Yoga & Exercise Mats',
    category: 'fitness',
    subcategory: 'Yoga & Pilates',
    aliases: ['yoga mat', 'exercise mat', 'gym mat', 'mkeka wa yoga'],
    variants: []
  },
  {
    key: 'boxing_gloves',
    name: 'Boxing Gloves & Combat Gear',
    category: 'fitness',
    subcategory: 'Combat Sports',
    aliases: ['boxing gloves', 'gloves za ndondi', 'boxing', 'punching gloves', 'everlast'],
    variants: []
  },
  {
    key: 'apartments',
    name: 'Apartments & Rentals',
    category: 'housing',
    subcategory: 'Residential Rentals',
    aliases: ['apartment', 'apartments', 'one bedroom', '1 bedroom', '2 bedroom', 'house rent', 'flat'],
    variants: [
      { key: '1bed', name: '1 Bedroom', aliases: ['1 bedroom', 'one bedroom', 'chumba kimoja'] },
      { key: '2bed', name: '2 Bedroom', aliases: ['2 bedroom', 'two bedroom', 'vyumba viwili'] },
      { key: 'studio', name: 'Studio / Bedsitter', aliases: ['studio', 'bedsitter'] }
    ]
  }
];

// Brand dictionary for Kenya
const KNOWN_BRANDS = [
  'samsung', 'apple', 'iphone', 'tecno', 'infinix', 'xiaomi', 'oppo', 'nokia', 'sony', 'lg',
  'hp', 'dell', 'lenovo', 'asus', 'acer', 'macbook', 'jbl', 'ramtons', 'mika', 'bruhm', 'hisense',
  'bamburi', 'savannah', 'mombasa cement', 'blue triangle', 'dumuzas', 'totalenergies', 'total',
  'rubis', 'k-gas', 'afrigas', 'hashi', 'bobmil', 'superfoam', 'vitafoam', 'geisha', 'dettol',
  'colgate', 'sensodyne', 'close up', 'nike', 'adidas', 'puma', 'bata', 'kiwi', 'menengai', 'bidco',
  'kabras', 'mumias', 'ndhiwa', 'nutrameal', 'daawat', 'sunrice', 'pearl', 'amana', 'brookside',
  'kcc', 'ilara', 'tuzo', 'soko', 'jogoo', 'pembe', 'ajab', 'exe', 'fresh fri', 'rina', 'elianto',
  'supaloaf', 'broadways', 'festive'
];

// Size & Quantity patterns
const SIZE_REGEX = /\b(\d+(?:\.\d+)?\s*(?:kg|g|litre|litres|l|ml|gb|mb|tb|inch|inches|cm|mm|m|ft|piece|pieces|pair|pairs|pack|set|tier|seater|seater|x\d+))\b/i;

// Parse search input into a comprehensive extraction pipeline
export function analyzeSearchQuery(rawQuery: string): SearchQueryAnalysis {
  let cleaned = cleanQuery(rawQuery);

  // 1. Strip natural language inquiry prefixes
  for (const prefix of QUERY_PREFIXES) {
    if (prefix.test(cleaned)) {
      cleaned = cleaned.replace(prefix, '').trim();
      break;
    }
  }

  // 2. Strip inquiry suffixes
  for (const suffix of QUERY_SUFFIXES) {
    if (suffix.test(cleaned)) {
      cleaned = cleaned.replace(suffix, '').trim();
      break;
    }
  }

  // 3. Extract location mentions
  let detectedLocation: string | undefined;
  let detectedCountry: string | undefined;
  let detectedRegion: string | undefined;
  let detectedCity: string | undefined;
  let detectedArea: string | undefined;

  const sortedLocations = Object.keys(WORLDWIDE_LOCATIONS).sort((a, b) => b.length - a.length);

  for (const locKey of sortedLocations) {
    const regex = new RegExp(`\\b${locKey}\\b`, 'i');
    if (regex.test(cleaned)) {
      const locInfo = WORLDWIDE_LOCATIONS[locKey];
      detectedLocation = locInfo.town || locInfo.county;
      detectedCountry = locInfo.country;
      detectedRegion = locInfo.county;
      detectedCity = locInfo.town;
      detectedArea = locInfo.town;
      cleaned = cleaned.replace(regex, '').replace(/\s+/g, ' ').trim();
      break;
    }
  }

  // 4. Extract Brand if present
  let detectedBrand: string | undefined;
  for (const brand of KNOWN_BRANDS) {
    const brandRegex = new RegExp(`\\b${brand}\\b`, 'i');
    if (brandRegex.test(cleaned)) {
      detectedBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
      break;
    }
  }

  // 5. Extract Size / Quantity if present
  let detectedSize: string | undefined;
  const sizeMatch = cleaned.match(SIZE_REGEX);
  if (sizeMatch) {
    detectedSize = sizeMatch[0];
  }

  // 6. Match Base Product & Variants
  let baseProduct: string | undefined;
  let detectedVariant: string | undefined;
  let canonicalName: string | undefined;
  let detectedCategory: string | undefined;
  let detectedSubcategory: string | undefined;

  for (const bp of BASE_PRODUCTS) {
    const matchesBP = bp.aliases.some(alias => {
      const aClean = cleanQuery(alias);
      return cleaned === aClean || cleaned.startsWith(aClean + ' ') || cleaned.endsWith(' ' + aClean) || cleaned.includes(' ' + aClean + ' ');
    });

    if (matchesBP) {
      baseProduct = bp.key;
      canonicalName = bp.name;
      detectedCategory = bp.category;
      detectedSubcategory = bp.subcategory;

      // Check if any specific variant of this base product is mentioned
      for (const v of bp.variants) {
        const matchesVariant = v.aliases.some(vAlias => {
          const vaClean = cleanQuery(vAlias);
          return cleaned.includes(vaClean);
        });

        if (matchesVariant) {
          detectedVariant = v.key;
          break;
        }
      }
      break;
    }
  }

  // Fallback to CANONICAL_CONCEPTS if not in BASE_PRODUCTS
  if (!baseProduct) {
    for (const concept of CANONICAL_CONCEPTS) {
      for (const alias of concept.aliases) {
        const aliasClean = cleanQuery(alias);
        if (cleaned === aliasClean || cleaned.startsWith(aliasClean + ' ') || cleaned.endsWith(' ' + aliasClean) || cleaned.includes(' ' + aliasClean + ' ')) {
          canonicalName = concept.canonicalName;
          detectedCategory = concept.category;
          detectedSubcategory = concept.subcategory;
          break;
        }
      }
      if (canonicalName) break;
    }
  }

  // Determine if this is a broad query (e.g. user just searched "sugar", "rice", "shoes", without variant or size)
  const isBroadQuery = Boolean(baseProduct && !detectedVariant && !detectedSize && !detectedBrand);

  return {
    rawQuery,
    itemQuery: cleaned,
    baseProduct,
    detectedVariant,
    detectedBrand,
    detectedSize,
    detectedLocation,
    detectedCategory,
    detectedSubcategory,
    canonicalName,
    isBroadQuery
  };
}

// Custom stem/alias normalizer for Kenyan English & Swahili
export function getCanonicalVariants(text: string): string[] {
  const norm = cleanQuery(text);
  const variants = new Set<string>([norm]);

  // Handle common typos & spelling variations in Kenya
  if (norm.includes('sukaari')) variants.add(norm.replace('sukaari', 'sukari'));
  if (norm.includes('kinozi')) variants.add(norm.replace('kinozi', 'kinyozi'));
  if (norm.includes('toughies')) variants.add(norm.replace('toughies', 'toughees'));
  if (norm.includes('ndiwa')) variants.add(norm.replace('ndiwa', 'ndhiwa'));
  if (norm.includes('bed sitters')) variants.add(norm.replace('bed sitters', 'bedsitters'));
  if (norm.includes('bed sitter')) variants.add(norm.replace('bed sitter', 'bedsitter'));
  if (norm.includes('carwash')) variants.add(norm.replace('carwash', 'car wash'));

  // Handle compound words
  if (norm.includes('water melon')) variants.add(norm.replace('water melon', 'watermelon'));
  if (norm.includes('watermelon')) variants.add(norm.replace('watermelon', 'water melon'));
  if (norm.includes('shoe rack')) variants.add(norm.replace('shoe rack', 'shoerack'));
  if (norm.includes('shoerack')) variants.add(norm.replace('shoerack', 'shoe rack'));
  if (norm.includes('boda boda')) variants.add(norm.replace('boda boda', 'bodaboda'));
  if (norm.includes('bodaboda')) variants.add(norm.replace('bodaboda', 'boda boda'));

  // Swahili apostrophes & spellings
  if (norm.includes("ng'ombe")) variants.add(norm.replace("ng'ombe", 'ngombe'));
  if (norm.includes('ngombe')) variants.add(norm.replace('ngombe', "ng'ombe"));
  if (norm.includes('tikitimaji')) variants.add(norm.replace('tikitimaji', 'tikiti maji'));
  if (norm.includes('tikiti maji')) variants.add(norm.replace('tikiti maji', 'tikitimaji'));

  // Match concept aliases
  for (const concept of CANONICAL_CONCEPTS) {
    if (concept.aliases.some(a => norm === a || norm.includes(a) || a.includes(norm))) {
      concept.aliases.forEach(a => variants.add(a));
    }
  }

  // Plurals
  if (norm.endsWith('s') && norm.length > 3) variants.add(norm.slice(0, -1));
  if (!norm.endsWith('s') && norm.length >= 3) variants.add(norm + 's');

  return Array.from(variants);
}

// Calculate match score between query and product with full identity & variant awareness
export function calculateMatchScore(queryOrAnalysis: string | SearchQueryAnalysis, product: Product): number {
  const analysis: SearchQueryAnalysis = typeof queryOrAnalysis === 'string'
    ? analyzeSearchQuery(queryOrAnalysis)
    : queryOrAnalysis;

  const cleanQ = cleanQuery(analysis.itemQuery);
  if (!cleanQ) return 100;

  const queryVariants = getCanonicalVariants(cleanQ);

  const prodName = cleanQuery(product.name);
  const swaName = cleanQuery(product.swahiliName || '');
  const aliases = (product.aliases || []).map(cleanQuery);
  const category = cleanQuery(product.category);
  const subcategory = cleanQuery(product.subcategory || '');
  const brand = cleanQuery(product.brand || '');
  const sizeOrQty = cleanQuery(product.sizeOrQuantity || '');
  const searchableAll = `${prodName} ${swaName} ${aliases.join(' ')} ${brand} ${sizeOrQty} ${product.unit}`.toLowerCase();

  // =========================================================================
  // CRITICAL ANTI-COLLISION GUARDS:
  // =========================================================================

  // 1. Watermelon must NEVER match bottled water / water tank / drinking water
  const isWatermelonQuery = cleanQ.includes('watermelon') || cleanQ.includes('water melon') || cleanQ.includes('tikiti');
  const isBottledWaterProduct = prodName.includes('bottled water') || prodName.includes('mineral water') || prodName.includes('water tank') || prodName.includes('drinking water');
  if (isWatermelonQuery && isBottledWaterProduct) {
    return 0; // Absolute block
  }
  const isWaterQuery = (cleanQ === 'water' || cleanQ === 'bottled water' || cleanQ === 'mineral water' || cleanQ === 'drinking water' || cleanQ === 'maji');
  const isWatermelonProduct = prodName.includes('watermelon') || swaName.includes('tikiti') || aliases.some(a => a.includes('tikiti') || a.includes('watermelon'));
  if (isWaterQuery && isWatermelonProduct) {
    return 0; // Absolute block
  }

  // 2. Underwear / Boxers vs Boxing gloves / equipment:
  const isBoxersQuery = /\b(boxer|boxers|underwear|innerwear|panties|panty|briefs|suruali ya ndani)\b/i.test(cleanQ);
  const isBoxingSportProduct = /\b(boxing glove|boxing gloves|punching bag|boxing ring|boxing shorts)\b/i.test(prodName);
  if (isBoxersQuery && isBoxingSportProduct) {
    return 0;
  }
  const isBoxingQuery = /\b(boxing glove|boxing gloves|punching bag)\b/i.test(cleanQ);
  const isInnerwearProduct = /\b(underwear|innerwear|boxers|panties|briefs|suruali ya ndani)\b/i.test(searchableAll);
  if (isBoxingQuery && isInnerwearProduct) {
    return 0;
  }

  // 3. Shoe rack vs plain wearable shoes:
  const isShoeRackQuery = cleanQ.includes('shoe rack') || cleanQ.includes('shoerack') || cleanQ.includes('rack ya viatu') || cleanQ.includes('shoe stand');
  const isPlainShoesProduct = (prodName.includes('shoes') || prodName.includes('sneakers') || prodName.includes('toughees') || prodName.includes('loafers')) && !prodName.includes('rack');
  if (isShoeRackQuery && isPlainShoesProduct) {
    return 0;
  }
  const isPlainShoesQuery = (cleanQ === 'shoes' || cleanQ === 'viatu' || cleanQ === 'sneakers' || cleanQ === 'raba');
  const isShoeRackProduct = prodName.includes('rack') || prodName.includes('stand') || category.includes('furniture');
  if (isPlainShoesQuery && isShoeRackProduct) {
    return 0; // User asked for shoes to wear, not a furniture shoe rack
  }

  // 4. Smartphone vs Phone Case / Screen Protector:
  const userWantsAccessory = /\b(case|cover|protector|screen protector|cable|charger|chaja)\b/i.test(cleanQ);
  const productIsAccessory = /\b(case|cover|protector|screen protector)\b/i.test(prodName);
  if (!userWantsAccessory && productIsAccessory) {
    return 0;
  }
  if (userWantsAccessory && !productIsAccessory && category === 'electronics') {
    return 0;
  }

  // =========================================================================
  // BASE PRODUCT LOGIC (Parent Category & Variant Rules)
  // =========================================================================
  if (analysis.baseProduct) {
    const bp = BASE_PRODUCTS.find(b => b.key === analysis.baseProduct);
    if (bp) {
      // Check if this product belongs to the base product family
      const belongsToBase = bp.aliases.some(alias => {
        const aClean = cleanQuery(alias);
        return prodName.includes(aClean) || swaName.includes(aClean) || aliases.some(a => a.includes(aClean));
      }) || product.id.startsWith(`prod-${bp.key}`) || product.id.includes(bp.key);

      if (belongsToBase) {
        // A) SPECIFIC VARIANT NARROWING
        // If a specific variant is requested (e.g. "brown sugar" -> 'brown'), narrow strictly!
        if (analysis.detectedVariant) {
          const requestedVariant = bp.variants.find(v => v.key === analysis.detectedVariant);
          if (requestedVariant) {
            const matchesReqVariant = requestedVariant.aliases.some(va => {
              const vaClean = cleanQuery(va);
              return searchableAll.includes(vaClean);
            });

            if (!matchesReqVariant) {
              return 0; // Exclude products that do not match the specified variant!
            }
          }
        }

        // B) SPECIFIC SIZE NARROWING
        // If a specific size is requested (e.g. "2kg brown sugar" -> '2kg'), narrow strictly!
        if (analysis.detectedSize) {
          const reqSizeNorm = analysis.detectedSize.toLowerCase().replace(/\s+/g, '');
          const prodHasReqSize = searchableAll.replace(/\s+/g, '').includes(reqSizeNorm);

          if (!prodHasReqSize) {
            // Check for size collision (e.g. user asked for 2kg, product is 1kg)
            const otherCommonSizes = ['1kg', '2kg', '500g', '5kg', '500ml', '1l', '1litre', '2l', '128gb', '256gb'];
            const conflictingSize = otherCommonSizes.find(s => s !== reqSizeNorm && searchableAll.replace(/\s+/g, '').includes(s));
            if (conflictingSize) {
              return 0; // Strictly exclude conflicting sizes!
            }
          }
        }

        // C) SPECIFIC BRAND NARROWING
        if (analysis.detectedBrand) {
          const reqBrandClean = cleanQuery(analysis.detectedBrand);
          if (!searchableAll.includes(reqBrandClean)) {
            return 0; // Brand requested but doesn't match
          }
        }

        // D) BROAD QUERY OR MATCHED VARIANT:
        // Returns all relevant variants when broad (e.g. "sugar" returns white, brown, raw; "rice" returns pishori, basmati, sindano)
        return 95;
      }
    }
  }

  // =========================================================================
  // GENERAL MATCH SCORING (For items outside base products or specific queries)
  // =========================================================================

  // Exact Match Check
  for (const qv of queryVariants) {
    if (prodName === qv || swaName === qv || aliases.includes(qv)) {
      return 100;
    }
  }

  // Substring Match with word boundary
  for (const qv of queryVariants) {
    if (qv.length >= 3) {
      const boundaryRegex = new RegExp(`(^|\\s)${qv}($|\\s)`);
      if (boundaryRegex.test(prodName) || boundaryRegex.test(swaName) || aliases.some(a => boundaryRegex.test(a))) {
        return 90;
      }
    }
  }

  // Token-level accuracy guard
  const queryTokens = cleanQ.split(/\s+/).filter(t => t.length > 1 && !['a', 'an', 'the', 'ya', 'wa', 'za', 'na', 'for', 'in', 'at'].includes(t));
  const allSearchableWords = [
    ...prodName.split(/\s+/),
    ...swaName.split(/\s+/),
    ...aliases.flatMap(a => a.split(/\s+/)),
    ...category.split(/\s+/),
    ...subcategory.split(/\s+/),
    ...brand.split(/\s+/)
  ].filter(Boolean);

  let tokensMatched = 0;
  for (const token of queryTokens) {
    if (allSearchableWords.some(w => w === token || (w.startsWith(token) && Math.abs(w.length - token.length) <= 2))) {
      tokensMatched++;
    }
  }

  if (tokensMatched === queryTokens.length && queryTokens.length > 0) {
    return 80;
  }

  if (tokensMatched > 0 && queryTokens.length > 1 && tokensMatched >= Math.ceil(queryTokens.length * 0.6)) {
    return 65;
  }

  return 0;
}

// Main Search Function with Strict Location Enforcement
export function searchProducts(
  products: Product[],
  rawQuery: string,
  selectedCategory?: string,
  selectedCounty?: string
): Product[] {
  const analysis = analyzeSearchQuery(rawQuery);
  const targetItem = analysis.itemQuery;
  const targetLocation = selectedCounty || analysis.detectedLocation;

  let candidates = products;

  // 1. Strict Location Filtering:
  // If user searched "bedsitters Rongai" or selected Rongai, ONLY return items strictly matching Rongai.
  // Never silently include Westlands, Kilimani, Nairobi CBD, etc.
  if (targetLocation && targetLocation.toLowerCase() !== 'all' && targetLocation.toLowerCase() !== 'kenya') {
    candidates = candidates.filter(p => matchesStrictLocation(p, targetLocation));
  }

  // 2. Filter by category if selected
  if (selectedCategory && selectedCategory !== 'all') {
    candidates = candidates.filter(p => {
      const pCat = p.category.toLowerCase().replace(/[^a-z]/g, '');
      const sCat = selectedCategory.toLowerCase().replace(/[^a-z]/g, '');
      return pCat === sCat || pCat.includes(sCat) || sCat.includes(pCat);
    });
  }

  // If query is completely empty, return items sorted by confirms & reports
  if (!targetItem) {
    return candidates;
  }

  // 3. Score candidates strictly with product identity matching
  const scored = candidates
    .map(product => {
      const matchScore = calculateMatchScore(analysis, product);
      return { product, totalScore: matchScore };
    })
    .filter(item => item.totalScore >= 60)
    .sort((a, b) => b.totalScore - a.totalScore);

  return scored.map(item => item.product);
}

// Convert GroupedProductComparison from Multi-Source Connectors to unified Product format
export function convertGroupedToProduct(group: GroupedProductComparison, targetLocation?: string): Product {
  const rep = group.listings[0];
  const hasDemoListing = group.listings.some(l => l.isDemo);

  const vendors: VendorPrice[] = group.listings.map((l, index) => ({
    id: `v-conn-${index}-${Date.now()}`,
    vendorName: l.vendor,
    price: l.price,
    unit: l.variant || 'unit',
    location: l.location,
    sourceType: l.sourceCategory === 'COMMUNITY' ? 'COMMUNITY' : (l.sourceCategory === 'SUPERMARKET' ? 'PHYSICAL_STORE' : (l.sourceCategory === 'OFFICIAL_REGULATOR' ? 'OFFICIAL' : 'ONLINE_RETAILER')),
    sourceUrl: l.sourceUrl,
    image: l.imageUrl,
    imageSource: l.imageSource || (l.imageUrl ? 'retailer' : 'fallback'),
    dateCollected: l.dateCollected,
    inStock: l.availability !== 'OUT_OF_STOCK',
    isDemo: l.isDemo,
    notes: l.notes || `Source: ${l.source} (${l.sourceMethod.replace('_', ' ')})`
  }));

  return {
    id: `connector-${group.canonicalId}`,
    name: group.productName,
    brand: group.brand,
    aliases: [group.productName.toLowerCase()],
    category: group.category,
    subcategory: group.subcategory,
    sizeOrQuantity: group.variant || 'Standard',
    unit: group.variant || 'unit',
    image: group.image,
    imageSource: group.imageSource || (group.image ? 'retailer' : 'fallback'),
    typicalPrice: group.typicalPrice,
    minPrice: group.lowestPrice,
    maxPrice: group.highestPrice,
    priceType: hasDemoListing ? 'MARKET_RETAIL' : (rep.sourceCategory === 'OFFICIAL_REGULATOR' ? 'VERIFIED_OFFICIAL' : (rep.sourceCategory === 'COMMUNITY' ? 'COMMUNITY_REPORT' : 'MARKET_RETAIL')),
    county: rep.county || targetLocation || 'Kenya',
    town: rep.town || rep.location,
    area: rep.area || rep.location,
    retailerOrSource: group.distinctVendors.slice(0, 3).join(', '),
    dateCollected: hasDemoListing ? 'Sample Benchmark' : 'Live Multi-Source Aggregation',
    reportsCount: group.sourcesCount,
    confirmsCount: 1,
    outdatesCount: 0,
    flaggedCount: 0,
    sourceUrl: rep.sourceUrl,
    description: hasDemoListing 
      ? `[DEMO DATA] Reference benchmark price index. Not verified live.`
      : `Price comparison aggregated across ${group.sourcesCount} verified Kenyan sources (${group.distinctVendors.join(', ')}). Lowest: KSh ${group.lowestPrice.toLocaleString()} | Highest: KSh ${group.highestPrice.toLocaleString()}.`,
    isRealtimeDiscovered: !hasDemoListing,
    isDemo: hasDemoListing,
    verified: !hasDemoListing,
    vendors,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Real-time live dynamic multi-source search query with timeout & truthfulness
export async function searchRealtimePrice(
  rawQuery: string,
  county?: string,
  category?: string,
  demoMode: boolean = false
): Promise<{ product: Product | null; products?: Product[]; verified: boolean; message?: string; sources?: string[] }> {
  const analysis = analyzeSearchQuery(rawQuery);
  const targetLocation = county || analysis.detectedLocation;

  // 1. Query server backend for live web discovery and connected sources in parallel
  const backendPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9500);
      const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

      const res = await fetch(`${baseUrl}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: rawQuery, county: targetLocation, category }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.verified && (data.product || (data.products && data.products.length > 0))) {
          const prods: Product[] = data.products && data.products.length > 0
            ? data.products
            : (data.product ? [data.product] : []);
          return { products: prods, sources: data.sources || [] };
        }
      }
    } catch (err: any) {
      console.warn('[SearchEngine] Backend live discovery search note:', err?.message || err);
    }
    return { products: [] as Product[], sources: [] as string[] };
  })();

  const connectorPromise = (async () => {
    try {
      const connectorResult = await connectorRegistry.searchAll(analysis, targetLocation, category, demoMode);
      if (connectorResult.groupedResults.allGroups && connectorResult.groupedResults.allGroups.length > 0) {
        const unifiedProducts = connectorResult.groupedResults.allGroups.map(g => convertGroupedToProduct(g, targetLocation));
        return { products: unifiedProducts, sources: connectorResult.queriedSources };
      }
    } catch (connectorErr) {
      console.warn('[SearchEngine] Connector search note:', connectorErr);
    }
    return { products: [] as Product[], sources: [] as string[] };
  })();

  const [backendSettled, connectorSettled] = await Promise.allSettled([backendPromise, connectorPromise]);
  const backendRes = backendSettled.status === 'fulfilled' ? backendSettled.value : { products: [] as Product[], sources: [] as string[] };
  const connectorRes = connectorSettled.status === 'fulfilled' ? connectorSettled.value : { products: [] as Product[], sources: [] as string[] };

  const allSources = Array.from(new Set([...backendRes.sources, ...connectorRes.sources]));

  // Combine products: if a product exists across multiple sources/marketplaces, merge vendors so all appear on initial result
  const combinedMap = new Map<string, Product>();

  for (const p of [...backendRes.products, ...connectorRes.products]) {
    const key = p.name.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().split(/\s+/).slice(0, 3).join('-');
    if (!combinedMap.has(key)) {
      combinedMap.set(key, { ...p });
    } else {
      const existing = combinedMap.get(key)!;
      // Merge vendors
      const mergedVendors = [...(existing.vendors || []), ...(p.vendors || [])];
      const uniqueVendors = mergedVendors.filter((v, idx, arr) =>
        arr.findIndex(other => other.vendorName === v.vendorName && other.price === v.price) === idx
      );
      existing.vendors = uniqueVendors;
      existing.retailerOrSource = Array.from(new Set(uniqueVendors.map(v => v.vendorName))).slice(0, 4).join(', ');
      const prices = uniqueVendors.map(v => v.price).filter(pr => pr > 0);
      if (prices.length > 0) {
        existing.minPrice = Math.min(...prices);
        existing.maxPrice = Math.max(...prices);
        existing.typicalPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      }
    }
  }

  const mergedProducts = Array.from(combinedMap.values());

  if (mergedProducts.length > 0) {
    // Prioritize products with verified images
    mergedProducts.sort((a, b) => {
      const aImg = a.image ? 1 : 0;
      const bImg = b.image ? 1 : 0;
      if (aImg !== bImg) return bImg - aImg;
      return a.typicalPrice - b.typicalPrice;
    });

    // Filter out demo/fake product listings from normal production search results
    const filteredProducts = demoMode
      ? mergedProducts
      : mergedProducts.filter(p => !p.isDemo && !p.name.includes('[DEMO DATA]') && !(p.retailerOrSource && p.retailerOrSource.includes('[DEMO DATA]')));

    if (filteredProducts.length > 0) {
      return {
        verified: filteredProducts.some(p => !p.isDemo),
        product: filteredProducts[0],
        products: filteredProducts,
        sources: allSources
      };
    }
  }

  // 3. If no verified live price found across connected sources
  return {
    verified: false,
    product: null,
    products: [],
    message: "No verified current price found."
  };
}
