"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  TooltipProps,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatters";
import { formatChartCurrency, truncateLabel } from "@/lib/utils/chartHelpers";

interface BarChartCardProps {
  data: any[];
  title?: string;
  description?: string;
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  sortData?: boolean;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-1">{label}</p>
        <p className="text-sm text-muted-foreground">
          Value: <span className="font-medium text-foreground">{formatCurrency(payload[0].value as number)}</span>
        </p>
      </div>
    );
  }
  return null;
}

export function BarChartCard({
  data,
  title,
  description,
  xKey,
  yKey,
  color = "#8884d8",
  height = 300,
  showLegend = false,
  formatValue = formatChartCurrency,
  sortData = false,
}: BarChartCardProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center text-muted-foreground"
            style={{ height }}
          >
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort data if needed (descending by yKey)
  const chartData = sortData
    ? [...data].sort((a, b) => b[yKey] - a[yKey])
    : data;

  // Truncate long labels
  const processedData = chartData.map((item) => ({
    ...item,
    [xKey]: truncateLabel(item[xKey], 20),
  }));

  return (
    <Card>
      <CardHeader>
        {title && <CardTitle>{title}</CardTitle>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey={xKey}
              className="text-xs"
              tick={{ fill: "currentColor" }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "currentColor" }}
              tickFormatter={(value) => formatValue(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Bar
              dataKey={yKey}
              fill={color}
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
