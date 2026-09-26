import { analyzeSearchQuery, calculateMatchScore } from './src/services/searchEngine';
import { INITIAL_PRODUCTS } from './src/services/catalogData';

const testQueries = [
  'underwear',
  'panties',
  'boxers',
  'handkerchief',
  'glasses',
  'laces',
  'gas',
  'LPG',
  'humidifier',
  'workout equipment',
  'dumbbells',
  'resistance bands',
  'socks',
  'shoe rack',
  'watermelon',
  'sugar',
  'sukari',
  'cement',
  'beef',
  'nyama',
  'phone charger',
  'toothpaste',
  'soap',
  'bedsheets',
  'mattress',
  'barber',
  'plumber',
  'electrician',
  'how much are boxers in Nairobi',
  'bei ya gas refill Rongai',
  'shoe rack Westlands'
];

console.log('--- TESTING NATURAL LANGUAGE QUERY ANALYSIS ---');
for (const q of testQueries) {
  const analysis = analyzeSearchQuery(q);
  console.log(`Query: "${q}" -> Item: "${analysis.itemQuery}", Canonical: "${analysis.canonicalName || 'None'}", Location: "${analysis.detectedLocation || 'None'}", Category: "${analysis.detectedCategory || 'None'}"`);
}

console.log('\n--- TESTING ANTI-COLLISION GUARDS ---');
const watermelonProd = INITIAL_PRODUCTS.find(p => p.id === 'prod-watermelon-tikiti')!;
const waterProd = INITIAL_PRODUCTS.find(p => p.id === 'prod-bottled-water')!;

const melonScoreOnMelon = calculateMatchScore('watermelon', watermelonProd);
const melonScoreOnWater = calculateMatchScore('watermelon', waterProd);
const waterScoreOnMelon = calculateMatchScore('bottled water', watermelonProd);

console.log(`Query "watermelon" on Watermelon product: score = ${melonScoreOnMelon} (expected > 80)`);
console.log(`Query "watermelon" on Bottled Water product: score = ${melonScoreOnWater} (expected 0)`);
console.log(`Query "bottled water" on Watermelon product: score = ${waterScoreOnMelon} (expected 0)`);

if (melonScoreOnWater === 0 && waterScoreOnMelon === 0) {
  console.log('✓ PASS: Watermelon NEVER collides with Bottled Water');
} else {
  console.error('✗ FAIL: Collision detected!');
}
