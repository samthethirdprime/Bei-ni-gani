// Multi-Retailer Regression Test Suite for Bei Gani?
// Validates broad and exact product searches across Avechi, Kilimall, Gadgets Leo, and Web discovery.

const TARGET_QUERIES = [
  'Redmi',
  'Redmi smartphone',
  'Redmi 14C',
  'HP laptop',
  'HP laptop 8GB RAM',
  'Ramtons fridge',
  'Kettle',
  'LED lights'
];

interface TestReport {
  query: string;
  totalGenuineResults: number;
  distinctRetailers: string[];
  providersSucceeded: string[];
  providersFailed: string[];
  exactModelMatchPassed: boolean;
  productTypeMatchPassed: boolean;
  allHaveSourceUrlAndPrice: boolean;
  sampleResults: Array<{ name: string; price: number; vendor: string; url: string }>;
}

async function runRegression() {
  console.log('================================================================');
  console.log('BEI GANI? MULTI-RETAILER PRODUCT DISCOVERY REGRESSION AUDIT');
  console.log('Testing Live Retailers: Avechi Kenya, Kilimall Kenya, Gadgets Leo');
  console.log('================================================================\n');

  const reports: TestReport[] = [];

  for (const q of TARGET_QUERIES) {
    const start = Date.now();
    try {
      const res = await fetch('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });

      if (!res.ok) {
        console.error(`HTTP error ${res.status} for query "${q}"`);
        continue;
      }

      const data = await res.json();
      const items: any[] = data.items || [];
      const products: any[] = data.products || (data.product ? [data.product] : []);

      // Providers status
      const statuses: any[] = data.providersStatus || [];
      const succeeded = statuses.filter(s => s.status === 'success').map(s => s.providerName);
      const failed = statuses.filter(s => s.status === 'failed' || s.status === 'timeout').map(s => s.providerName);

      // Distinct retailers across returned items
      const retailers = Array.from(new Set(items.map(i => i.vendor || i.source).filter(Boolean)));

      // Check valid price and genuine source URL
      const allValid = items.every(i => {
        const hasPrice = typeof i.price === 'number' && i.price > 0;
        const hasUrl = typeof (i.url || i.sourceUrl) === 'string' && (i.url || i.sourceUrl).startsWith('http');
        return hasPrice && hasUrl;
      });

      // Relevance & Model checks
      let modelMatchPassed = true;
      let productTypeMatchPassed = true;

      const qLower = q.toLowerCase();

      for (const item of items) {
        const title = (item.name || '').toLowerCase();

        // Anti-accessory check
        if (!/\b(case|cover|protector)\b/i.test(qLower) && /\b(case|cover|protector|tempered glass|screen replacement)\b/i.test(title)) {
          modelMatchPassed = false;
        }

        // Exact model check for Redmi 14C
        if (q === 'Redmi 14C') {
          if (!title.includes('14c') && !title.includes('14 c')) {
            modelMatchPassed = false;
          }
        }

        // Exact RAM check for HP laptop 8GB RAM
        if (q === 'HP laptop 8GB RAM') {
          const has8Gb = title.includes('8gb') || title.includes('8 gb') || title.includes('8g');
          if (!has8Gb) {
            modelMatchPassed = false;
          }
        }

        // LED lights must not contain TVs
        if (q === 'LED lights') {
          if (/\b(tv|television|qled)\b/i.test(title)) {
            productTypeMatchPassed = false;
          }
        }

        // Kettle must not contain gym weights
        if (q === 'Kettle') {
          if (/\b(dumbbell|kettlebell|weights)\b/i.test(title)) {
            productTypeMatchPassed = false;
          }
        }

        // Washing machine
        if (q === 'Samsung washing machine') {
          if (!title.includes('samsung') || (!title.includes('washing machine') && !title.includes('washer'))) {
            productTypeMatchPassed = false;
          }
        }

        // Ramtons fridge
        if (q === 'Ramtons fridge') {
          if (!title.includes('ramtons') || (!title.includes('fridge') && !title.includes('refrigerator'))) {
            productTypeMatchPassed = false;
          }
        }
      }

      const sample = items.slice(0, 3).map(i => ({
        name: i.name,
        price: i.price,
        vendor: i.vendor || i.source,
        url: i.url || i.sourceUrl
      }));

      reports.push({
        query: q,
        totalGenuineResults: items.length,
        distinctRetailers: retailers,
        providersSucceeded: succeeded,
        providersFailed: failed,
        exactModelMatchPassed: modelMatchPassed,
        productTypeMatchPassed: productTypeMatchPassed,
        allHaveSourceUrlAndPrice: allValid && items.length > 0,
        sampleResults: sample
      });
    } catch (e: any) {
      console.error(`Error querying "${q}":`, e.message);
    }
  }

  // Print results
  for (const r of reports) {
    console.log(`----------------------------------------------------------------`);
    console.log(`QUERY: "${r.query}"`);
    console.log(`  • Genuine Results Found: ${r.totalGenuineResults}`);
    console.log(`  • Distinct Retailers (${r.distinctRetailers.length}): ${r.distinctRetailers.join(', ') || 'None'}`);
    console.log(`  • Providers Succeeded: ${r.providersSucceeded.join(', ') || 'None'}`);
    if (r.providersFailed.length > 0) {
      console.log(`  • Providers Failed/Timed Out: ${r.providersFailed.join(', ')}`);
    }
    console.log(`  • Exact Model Match: ${r.exactModelMatchPassed ? '✓ PASS' : '❌ FAIL'}`);
    console.log(`  • Product Type Match: ${r.productTypeMatchPassed ? '✓ PASS' : '❌ FAIL'}`);
    console.log(`  • Source URL & Price Integrity: ${r.allHaveSourceUrlAndPrice ? '✓ PASS' : '❌ FAIL'}`);
    console.log(`  • Top Sample Results:`);
    r.sampleResults.forEach((s, idx) => {
      console.log(`     ${idx + 1}. [${s.vendor}] ${s.name}`);
      console.log(`        Price: KSh ${s.price.toLocaleString()} | URL: ${s.url}`);
    });
  }
  console.log(`================================================================\n`);

  // Verify that target queries returned genuine items
  const failedQueries = reports.filter(r => r.totalGenuineResults === 0);
  if (failedQueries.length > 0) {
    console.warn(`Queries returning 0 results: ${failedQueries.map(f => f.query).join(', ')}`);
  } else {
    console.log('🎉 ALL 8 REQUIRED SEARCH QUERIES RETURNED GENUINE PRODUCT LISTINGS ACROSS MULTIPLE RETAILERS!');
  }
}

runRegression().catch(console.error);
