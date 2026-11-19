import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '../ui/Card';
import type { SensorDataResponse } from '../../types/sensor';

interface SensorChartProps {
  title: string;
  data: SensorDataResponse[] | null;
  keys: string[];
  colors: string[];
  unit: string;
  yDomain?: [number | 'auto', number | 'auto'];
}

export function SensorChart({
  title,
  data,
  keys,
  colors,
  unit,
  yDomain = ['auto', 'auto'],
}: SensorChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .slice(-50)
      .map((reading) => {
        const point: Record<string, number | string | null> = {
          time: new Date(reading.timestamp).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }),
          timestamp: new Date(reading.timestamp).getTime(),
        };

        keys.forEach((key) => {
          const value = getNestedValue(reading, key);
          point[key] = value;
        });

        return point;
      })
      .filter((point) => keys.some((key) => point[key] !== null));
  }, [data, keys]);

  const latestValues = useMemo(() => {
    if (!data || data.length === 0) return {};
    const latest = data[data.length - 1];
    const result: Record<string, number | null> = {};
    keys.forEach((key) => {
      result[key] = getNestedValue(latest, key);
    });
    return result;
  }, [data, keys]);

  if (chartData.length === 0) {
    return (
      <Card className="h-[260px] flex items-center justify-center">
        <div className="text-center text-surface-500">
          <p className="font-medium">{title}</p>
          <p className="text-sm mt-1">No data available</p>
        </div>
      </Card>
    );
  }

  const formatValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const formatTooltip = (value: number): [string, string] => {
    return [formatValue(value), ''];
  };

  const formatAxis = (value: number): string => {
    return `${formatValue(value)} ${unit}`;
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-surface-900">{title}</h3>
        <div className="flex flex-wrap items-center gap-4">
          {keys.map((key, index) => {
            const val = latestValues[key];
            const formatted = formatValue(val);
            return (
              <div key={key} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: colors[index] }}
                />
                <span className="text-surface-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="font-mono text-surface-900 tabular-nums">
                  {formatted} {unit}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tickFormatter={(value) => value}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={yDomain}
              tickFormatter={(value) => formatAxis(value)}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ color: '#334155', fontWeight: 500 }}
              formatter={formatTooltip}
            />
            <Legend />
            {keys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2 }}
                connectNulls={true}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function getNestedValue(obj: Record<string, unknown>, path: string): number | null {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return null;
  }, obj) as number | null;
}

export const CHART_COLORS = {
  primary: '#0ea5e9',
  secondary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#a855f7',
  pink: '#ec4899',
} as const;

export const CHART_COLOR_PALETTES = {
  accel: [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.success] as const,
  gyro: [CHART_COLORS.warning, CHART_COLORS.danger, CHART_COLORS.pink] as const,
  distance: [CHART_COLORS.success, CHART_COLORS.info] as const,
  temperature: [CHART_COLORS.danger] as const,
  signal: [CHART_COLORS.purple] as const,
} as const;