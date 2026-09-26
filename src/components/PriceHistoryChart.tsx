import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Product, CommunityReport } from '../types';
import { TrendingUp, TrendingDown, Clock, MapPin, Store, Sparkles, Activity } from 'lucide-react';

interface PriceHistoryChartProps {
  product: Product;
  reports: CommunityReport[];
}

interface ChartPoint {
  id: string;
  dateLabel: string;
  fullDate: string;
  price: number;
  storeName: string;
  location: string;
  notes?: string;
  isBenchmark?: boolean;
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ product, reports }) => {
  // Format date helper
  const formatDateLabel = (isoString?: string): string => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Recent';
      return d.toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  const formatFullDate = (isoString?: string): string => {
    if (!isoString) return 'Recently';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  // Prepare chronological chart dataset
  const chartData: ChartPoint[] = useMemo(() => {
    if (!reports || reports.length === 0) {
      // Baseline trajectory when no community reports logged yet
      const now = new Date();
      const past2Weeks = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const pastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      return [
        {
          id: 'base-1',
          dateLabel: formatDateLabel(pastMonth.toISOString()),
          fullDate: formatFullDate(pastMonth.toISOString()),
          price: product.minPrice,
          storeName: product.retailerOrSource || 'Market Survey',
          location: product.county,
          notes: 'Estimated entry range',
          isBenchmark: true
        },
        {
          id: 'base-2',
          dateLabel: formatDateLabel(past2Weeks.toISOString()),
          fullDate: formatFullDate(past2Weeks.toISOString()),
          price: product.typicalPrice,
          storeName: product.retailerOrSource || 'Market Average',
          location: product.county,
          notes: 'Benchmark typical price',
          isBenchmark: true
        },
        {
          id: 'base-3',
          dateLabel: formatDateLabel(now.toISOString()),
          fullDate: formatFullDate(now.toISOString()),
          price: product.typicalPrice,
          storeName: 'Current Market Retail',
          location: product.county,
          notes: 'Current typical price',
          isBenchmark: true
        }
      ];
    }

    // Sort existing reports chronologically
    const sortedReports = [...reports].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeA - timeB;
    });

    const points: ChartPoint[] = sortedReports.map((r) => ({
      id: r.id,
      dateLabel: formatDateLabel(r.createdAt),
      fullDate: formatFullDate(r.createdAt),
      price: r.reportedPrice,
      storeName: r.storeName || 'Local Seller',
      location: r.area ? `${r.town || r.county} (${r.area})` : r.town || r.county || 'Kenya',
      notes: r.notes
    }));

    // If only 1 report exists, prepend baseline so line can be drawn
    if (points.length === 1) {
      const repDate = new Date(sortedReports[0].createdAt);
      const prevDate = new Date(repDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      points.unshift({
        id: 'baseline-anchor',
        dateLabel: formatDateLabel(prevDate.toISOString()),
        fullDate: formatFullDate(prevDate.toISOString()),
        price: product.typicalPrice,
        storeName: product.retailerOrSource || 'Catalog Baseline',
        location: product.county,
        notes: 'Market benchmark baseline',
        isBenchmark: true
      });
    }

    return points;
  }, [reports, product]);

  // Summary statistics from actual reports (or product range if empty)
  const stats = useMemo(() => {
    if (reports && reports.length > 0) {
      const prices = reports.map((r) => r.reportedPrice);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
      const latest = prices[prices.length - 1];
      const diffFromTypical = latest - product.typicalPrice;
      return { min, max, avg, latest, diffFromTypical, count: reports.length };
    }
    return {
      min: product.minPrice,
      max: product.maxPrice,
      avg: product.typicalPrice,
      latest: product.typicalPrice,
      diffFromTypical: 0,
      count: 0
    };
  }, [reports, product]);

  // Compute nice Y-axis domain padding
  const yDomain = useMemo(() => {
    const allPrices = [
      ...chartData.map((d) => d.price),
      product.typicalPrice,
      product.minPrice,
      product.maxPrice
    ].filter((p) => typeof p === 'number' && !isNaN(p) && p > 0);

    if (allPrices.length === 0) return ['auto', 'auto'];

    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    const padding = Math.max(Math.round((max - min) * 0.18), Math.round(min * 0.05), 10);
    return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)];
  }, [chartData, product]);

  // Custom sleek Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: ChartPoint = payload[0].payload;
      const diff = data.price - product.typicalPrice;

      return (
        <div className="bg-neutral-950/95 border border-neutral-700/80 p-3 rounded-2xl shadow-2xl backdrop-blur-md max-w-xs text-xs space-y-1.5 z-50">
          <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-1.5">
            <span className="font-semibold text-neutral-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-neutral-500" />
              {data.fullDate}
            </span>
            {data.isBenchmark ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/60">
                Benchmark
              </span>
            ) : (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                User Report
              </span>
            )}
          </div>

          <div>
            <div className="text-[11px] text-neutral-400 uppercase font-semibold">Reported Price</div>
            <div className="text-base font-extrabold text-emerald-400">
              KSh {data.price.toLocaleString()}{' '}
              <span className="text-xs font-normal text-neutral-400">/ {product.unit}</span>
            </div>
          </div>

          <div className="text-[11px] text-neutral-300 space-y-0.5 pt-0.5">
            <div className="flex items-center gap-1">
              <Store className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span className="font-semibold text-neutral-200">{data.storeName}</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-400">
              <MapPin className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span>{data.location}</span>
            </div>
            {data.notes && (
              <div className="italic text-neutral-400 text-[10px] pt-1">
                "{data.notes}"
              </div>
            )}
          </div>

          {/* Price deviation badge */}
          <div className="pt-1 border-t border-neutral-800/80">
            {diff === 0 ? (
              <span className="text-[11px] text-neutral-400">Matches typical benchmark</span>
            ) : diff > 0 ? (
              <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                +KSh {diff.toLocaleString()} above typical
              </span>
            ) : (
              <span className="text-[11px] text-teal-400 font-semibold flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" />
                -KSh {Math.abs(diff).toLocaleString()} below typical
              </span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-neutral-950/70 border border-neutral-800/90 rounded-2xl p-4 space-y-3.5">
      {/* Header & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5 font-['Space_Grotesk']">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Price History & Trends</span>
          </h4>
          <p className="text-[11px] text-neutral-400">
            Chronological prices paid in Kenya plotted over time
          </p>
        </div>

        {/* Quick Summary Pill Badges */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-xl">
            <span className="text-[10px] text-neutral-500 uppercase block font-semibold leading-none">
              Lowest
            </span>
            <span className="font-bold text-teal-400">
              KSh {stats.min.toLocaleString()}
            </span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-xl">
            <span className="text-[10px] text-neutral-500 uppercase block font-semibold leading-none">
              Average
            </span>
            <span className="font-bold text-white">
              KSh {stats.avg.toLocaleString()}
            </span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-xl">
            <span className="text-[10px] text-neutral-500 uppercase block font-semibold leading-none">
              Highest
            </span>
            <span className="font-bold text-amber-400">
              KSh {stats.max.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Line Chart Container */}
      <div className="w-full h-60 pt-1 min-w-0">
        <ResponsiveContainer width="100%" height="100%" minHeight={240}>
          <ComposedChart
            data={chartData}
            margin={{ top: 14, right: 14, left: -14, bottom: 4 }}
          >
            <defs>
              <linearGradient id="beiGaniPriceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#262626"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="dateLabel"
              stroke="#737373"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#404040' }}
              dy={6}
            />

            <YAxis
              domain={yDomain as any}
              stroke="#737373"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#404040' }}
              tickFormatter={(v) => `${v.toLocaleString()}`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Benchmark Reference Line */}
            <ReferenceLine
              y={product.typicalPrice}
              stroke="#059669"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Benchmark: KSh ${product.typicalPrice.toLocaleString()}`,
                fill: '#10b981',
                fontSize: 10,
                position: 'insideTopRight',
                offset: 8
              }}
            />

            {/* Area under curve for visual depth */}
            <Area
              type="monotone"
              dataKey="price"
              fill="url(#beiGaniPriceGradient)"
              stroke="none"
              isAnimationActive={true}
            />

            {/* Main Price Line */}
            <Line
              type="monotone"
              dataKey="price"
              name="Price Paid"
              stroke="#10b981"
              strokeWidth={3}
              activeDot={{
                r: 7,
                fill: '#34d399',
                stroke: '#064e3b',
                strokeWidth: 2
              }}
              dot={{
                r: 4.5,
                fill: '#10b981',
                stroke: '#022c22',
                strokeWidth: 2
              }}
              isAnimationActive={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Advice */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-800/80 text-[11px] text-neutral-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-500 rounded-full inline-block"></span>
            <span className="text-neutral-300 font-medium">Reported Price (KSh)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-emerald-500 inline-block"></span>
            <span className="text-emerald-400/90 font-medium">Market Benchmark</span>
          </div>
        </div>

        <span className="text-neutral-500">
          {reports.length > 0
            ? `${reports.length} user submissions plotted`
            : 'Initial baseline displayed'}
        </span>
      </div>
    </div>
  );
};
