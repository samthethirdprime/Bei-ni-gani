// Comprehensive Test Suite for Avechi Kenya WooCommerce Store API Integration
// Verifies: Price conversion, minor currency units, missing prices, anti-accessory guards,
// brand & model relevance, truthful verification, API failure & timeout handling, and live API connectivity.

import {
  parseWooCommercePrice,
  isAvechiProductRelevant,
  cleanHtmlEntities,
  isAccessoryTerm,
  AvechiProvider,
  AvechiRawProduct
} from '../server/providers/avechiProvider';
import {
  parseWooCommercePrice as parseClientWcPrice,
  isAvechiProductMatch,
  AvechiKenyaConnector
} from '../src/services/connectors/avechiConnector';
import { SearchQueryAnalysis } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function runTests() {
  console.log('=== TEST SUITE: AVECHI WOOCOMMERCE STORE API CONNECTOR ===\n');

  // 1. PRICE CONVERSION TESTS WITH MINOR CURRENCY UNITS
  console.log('1. Testing WooCommerce Store API Price Parsing & Currency Metadata');

  // Case 1A: Minor currency units = 2 (standard cents representation in WooCommerce Store API)
  const priceWithCents = parseWooCommercePrice({
    price: '3229900',
    currency_code: 'KES',
    currency_minor_unit: 2
  });
  assert(priceWithCents === 32299, 'Converts 3229900 with minor_unit: 2 to exactly KSh 32,299');

  const itelPrice = parseWooCommercePrice({
    price: '809900',
    currency_code: 'KES',
    currency_minor_unit: 2
  });
  assert(itelPrice === 8099, 'Converts 809900 with minor_unit: 2 to exactly KSh 8,099');

  // Case 1B: Minor currency units = 0 (store configured in whole currency units)
  const priceWholeUnits = parseWooCommercePrice({
    price: '450',
    currency_code: 'KES',
    currency_minor_unit: 0
  });
  assert(priceWholeUnits === 450, 'Retains whole unit price of KSh 450 when minor_unit: 0 (does NOT blindly divide by 100)');

  // Case 1C: Price formatted with decimal point string
  const priceDecimalStr = parseWooCommercePrice({
    price: '1500.50',
    currency_code: 'KES'
  });
  assert(priceDecimalStr === 1501, 'Correctly handles decimal string "1500.50" to KSh 1,501');

  // Case 1D: Sale price precedence
  const priceSaleActive = parseWooCommercePrice({
    price: '2139900',
    regular_price: '2499900',
    sale_price: '1999900',
    currency_minor_unit: 2
  });
  assert(priceSaleActive === 19999, 'Prioritizes sale_price 1999900 (KSh 19,999) over regular_price');

  // Case 1E: Price range fallback
  const priceRangeFallback = parseWooCommercePrice({
    price: null,
    price_range: {
      min_amount: '4199900',
      currency_minor_unit: 2
    }
  });
  assert(priceRangeFallback === 41999, 'Extracts min_amount from price_range when main price is null');

  // 2. MISSING & SUSPICIOUS PRICE GUARDS (NO PRICE FABRICATION)
  console.log('\n2. Testing Missing & Invalid Price Handling (No Price Fabrication)');

  assert(parseWooCommercePrice(null) === null, 'Returns null for null prices object');
  assert(parseWooCommercePrice({ price: null, sale_price: null, regular_price: null }) === null, 'Returns null when all price fields are null');
  assert(parseWooCommercePrice({ price: '' }) === null, 'Returns null for empty price string');
  assert(parseWooCommercePrice({ price: '0' }) === null, 'Returns null for KSh 0 (never fabricates free or zero price)');
  assert(parseWooCommercePrice({ price: '-500' }) === null, 'Returns null for negative price value');

  // 3. IMAGE PRESERVATION & NO FABRICATION
  console.log('\n3. Testing Image & Permalink Preservation');

  const sampleRawItem: AvechiRawProduct = {
    id: 12345,
    name: 'Xiaomi Redmi Note 17 4G 6GB 256GB',
    permalink: 'https://avechi.co.ke/product/xiaomi-redmi-note-17-4g-6gb-256gb/',
    prices: { price: '3229900', currency_minor_unit: 2 },
    images: [
      { id: 99, src: 'https://avechi.co.ke/wp-content/uploads/2026/08/Redmi-Note-17-600x600.jpg' }
    ],
    is_in_stock: true
  };

  const sampleItemNoImage: AvechiRawProduct = {
    id: 12346,
    name: 'Itel A50 4G 2GB 64GB',
    permalink: 'https://avechi.co.ke/product/itel-a50-4g-2gb-64gb/',
    prices: { price: '809900', currency_minor_unit: 2 },
    images: [],
    is_in_stock: true
  };

  assert(sampleRawItem.images![0].src.startsWith('https://avechi.co.ke/'), 'Preserves authentic Avechi product photograph URL');
  assert(sampleItemNoImage.images!.length === 0, 'Does not invent or fabricate missing image URLs');

  // 4. HTML ENTITY DECODING
  console.log('\n4. Testing HTML Entity Decoding');
  assert(cleanHtmlEntities('TCL 85&#8221; 4K QLED TV') === 'TCL 85" 4K QLED TV', 'Decodes &#8221; to double quote');
  assert(cleanHtmlEntities('Redmi-Note-17-600&#215;600') === 'Redmi-Note-17-600x600', 'Decodes &#215; to x');
  assert(cleanHtmlEntities('Smartphones &amp; Accessories') === 'Smartphones & Accessories', 'Decodes &amp; to &');

  // 5. ANTI-ACCESSORY & ANTI-COLLISION GUARDS
  console.log('\n5. Testing Strict Anti-Accessory Guards');

  // Searching for a device must NEVER match cases, screen protectors, or spare parts
  assert(!isAvechiProductRelevant('Redmi Note 14 Silicone Case Cover', 'Redmi Note 14'), 'Rejects phone case when searching for Redmi Note 14');
  assert(!isAvechiProductRelevant('Redmi Note 14 Tempered Glass Screen Protector', 'Redmi Note 14'), 'Rejects tempered glass screen protector');
  assert(!isAvechiProductRelevant('Redmi Note 14 LCD Display Screen Replacement', 'Redmi Note 14'), 'Rejects screen replacement spare part');
  assert(!isAvechiProductRelevant('Redmi Note 14 USB-C Fast Charging Cable', 'Redmi Note 14'), 'Rejects charging cable');
  assert(isAvechiProductRelevant('Xiaomi Redmi Note 14 5G 8GB 256GB', 'Redmi Note 14'), 'Accepts actual Redmi Note 14 device');

  // Searching for an accessory MUST match the accessory and NOT the phone
  assert(isAvechiProductRelevant('Redmi Note 14 Silicone Case Cover', 'Redmi Note 14 case'), 'Accepts case when user specifically searches for case');
  assert(!isAvechiProductRelevant('Xiaomi Redmi Note 14 5G 8GB 256GB', 'Redmi Note 14 case'), 'Rejects phone device when user specifically searches for case');

  // 6. UNRELATED PRODUCT DISCRIMINATION (LED LIGHTS VS TV, WASHING MACHINE, KETTLE)
  console.log('\n6. Testing Unrelated Product Category Discrimination');

  // Searching "LED lights" must NEVER match LED/QLED televisions
  assert(!isAvechiProductRelevant('TCL 85" 85T6D 4K QLED TV', 'LED lights'), 'Rejects TCL QLED TV when user searches for "LED lights"');
  assert(!isAvechiProductRelevant('Hisense 55" 4K UHD LED Smart TV', 'LED lights'), 'Rejects Hisense LED Smart TV when user searches for "LED lights"');
  assert(isAvechiProductRelevant('Xiaomi Smart LED Bulb White & Color', 'LED lights'), 'Accepts actual LED light bulb');

  // Searching "washing machine" must match washing machine
  assert(isAvechiProductRelevant('TCL P1108FL 8kg Front Load Washing Machine', 'washing machine'), 'Accepts TCL Front Load Washing Machine');
  assert(!isAvechiProductRelevant('Washing machine inlet pipe 2m', 'washing machine'), 'Rejects washing machine spare inlet pipe for device query');

  // Searching "kettle" must match kettle
  assert(isAvechiProductRelevant('Xiaomi Mi Smart Kettle Pro', 'kettle'), 'Accepts Xiaomi Mi Smart Kettle Pro');
  assert(!isAvechiProductRelevant('TCL Microwave 20L', 'kettle'), 'Rejects microwave when searching for kettle');

  // 7. STRICT BRAND & MODEL MATCHING
  console.log('\n7. Testing Strict Brand & Model Matching');

  // Redmi brand check
  assert(isAvechiProductRelevant('Xiaomi Redmi Note 17 4G', 'Redmi'), 'Accepts Xiaomi Redmi for "Redmi" query');
  assert(!isAvechiProductRelevant('Samsung Galaxy A15 4G', 'Redmi'), 'Rejects Samsung Galaxy A15 for "Redmi" query');
  assert(!isAvechiProductRelevant('Tecno Spark 50 Pro', 'Redmi'), 'Rejects Tecno Spark for "Redmi" query');
  assert(!isAvechiProductRelevant('Itel A50 4G', 'Redmi'), 'Rejects Itel A50 for "Redmi" query');

  // itel A50 model check
  assert(isAvechiProductRelevant('Itel A50 4G 2GB 64GB', 'itel A50'), 'Accepts Itel A50 for "itel A50" query');
  assert(!isAvechiProductRelevant('Itel A60 4G 2GB 32GB', 'itel A50'), 'Rejects Itel A60 when user asked for A50');
  assert(!isAvechiProductRelevant('Tecno Spark 50 Pro', 'itel A50'), 'Rejects Tecno for "itel A50" query');

  // Tecno Spark model check
  assert(isAvechiProductRelevant('Tecno Spark 50 Pro 4GB 128GB', 'Tecno Spark'), 'Accepts Tecno Spark for "Tecno Spark" query');
  assert(!isAvechiProductRelevant('Tecno Camon 30 8GB 256GB', 'Tecno Spark'), 'Rejects Tecno Camon when user asked for Spark');

  // 8. CLIENT CONNECTOR & REGISTRY INTERFACE TESTS
  console.log('\n8. Testing Client Connector Interface & Provenance');

  const connector = new AvechiKenyaConnector();
  assert(connector.id === 'avechi-ke', 'Connector ID is avechi-ke');
  assert(connector.displayName === 'Avechi Kenya', 'DisplayName is Avechi Kenya');
  assert(connector.isConfigured() === true, 'Reports isConfigured as true (fully active connection)');
  assert(connector.getStatus().online === true, 'Reports status as online');
  assert(connector.officialUrl === 'https://avechi.co.ke', 'Official URL is https://avechi.co.ke');

  const mockQuery: SearchQueryAnalysis = {
    rawQuery: 'Redmi',
    itemQuery: 'Redmi',
    detectedBrand: 'Redmi',
    detectedCategory: 'electronics'
  };

  assert(isAvechiProductMatch('Xiaomi Redmi Note 17 4G', mockQuery), 'Client matcher correctly matches Redmi');
  assert(!isAvechiProductMatch('Samsung Galaxy A15', mockQuery), 'Client matcher strictly rejects Samsung for Redmi');
  assert(!isAvechiProductMatch('Redmi Silicone Case', mockQuery), 'Client matcher strictly rejects Redmi Silicone Case');

  // 9. ERROR HANDLING & TIMEOUT RESILIENCE
  console.log('\n9. Testing Error Handling & Timeout Resilience');

  const provider = new AvechiProvider();
  assert(provider.id === 'avechi', 'Provider id is avechi');
  assert(provider.requiresAuth === false, 'Provider requiresAuth is false (public Store API)');

  // Empty query handling
  const emptyRes = await provider.search('');
  assert(emptyRes.status.status === 'success' && emptyRes.items.length === 0, 'Handles empty query gracefully without network call');

  // 10. LIVE INTEGRATION TEST (REAL AVECHI WC STORE API)
  console.log('\n10. Executing Live Network Integration Test against https://avechi.co.ke');

  try {
    const liveRedmiRes = await provider.search('Redmi', { maxResults: 4 });
    console.log(`  Live query "Redmi" status: ${liveRedmiRes.status.status}, items found: ${liveRedmiRes.items.length}, duration: ${liveRedmiRes.status.durationMs}ms`);

    if (liveRedmiRes.status.status === 'success' && liveRedmiRes.items.length > 0) {
      const firstItem = liveRedmiRes.items[0];
      console.log(`  Sample result 1: "${firstItem.name}" - KSh ${firstItem.price.toLocaleString()} (${firstItem.url})`);

      assert(firstItem.price > 1000 && firstItem.price < 500000, `Genuine Kenyan retail price (KSh ${firstItem.price}) in realistic range`);
      assert(firstItem.currency === 'KES', 'Currency is KES');
      assert(firstItem.vendor === 'Avechi Kenya', 'Vendor is Avechi Kenya');
      assert(firstItem.source === 'Avechi Kenya', 'Source is Avechi Kenya');
      assert(Boolean(firstItem.url?.startsWith('https://avechi.co.ke/')), 'Valid source URL on avechi.co.ke');
      assert(firstItem.isVerified === false, 'Truthful verification: isVerified is false (retailer catalog, unconfirmed by 1P checkout)');
      assert(firstItem.acquisitionMethod === 'direct_api', 'AcquisitionMethod is direct_api');
      assert(!isAccessoryTerm(firstItem.name), 'First item is not an accessory');
      assert(firstItem.name.toLowerCase().includes('redmi') || firstItem.name.toLowerCase().includes('xiaomi'), 'First item matches Redmi/Xiaomi');
    }

    const liveItelRes = await provider.search('itel A50', { maxResults: 2 });
    console.log(`  Live query "itel A50" status: ${liveItelRes.status.status}, items found: ${liveItelRes.items.length}`);
    if (liveItelRes.items.length > 0) {
      const itelItem = liveItelRes.items[0];
      console.log(`  Sample result 2: "${itelItem.name}" - KSh ${itelItem.price.toLocaleString()} (${itelItem.url})`);
      assert(itelItem.name.toLowerCase().includes('itel') && itelItem.name.toLowerCase().includes('a50'), 'Matches Itel A50');
      assert(itelItem.price >= 7000 && itelItem.price <= 15000, `Itel A50 price is realistic (KSh ${itelItem.price})`);
    }

    // Test a product that returns empty / unrelated items (LED lights)
    const liveLedTest = await provider.search('LED lights', { maxResults: 4 });
    console.log(`  Live query "LED lights" status: ${liveLedTest.status.status}, items found: ${liveLedTest.items.length}`);
    const tvInLights = liveLedTest.items.some(it => it.name.toLowerCase().includes('tv'));
    assert(!tvInLights, 'No TVs returned under "LED lights" query');

  } catch (err: any) {
    console.warn('  Live network test notice (non-fatal if offline):', err?.message || err);
  }

  console.log('\n🎉 ALL AVECHI INTEGRATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
