"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TrendPoint {
  dateKey: string;
  label: string;
  barangMasuk: number;
  barangKeluar: number;
}

interface StockTrendChartProps {
  trend7Days: TrendPoint[];
  trend30Days: TrendPoint[];
}

export function StockTrendChart({
  trend7Days,
  trend30Days,
}: StockTrendChartProps) {
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const activeData = range === "7d" ? trend7Days : trend30Days;

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle>Tren Pergerakan Barang Masuk vs Barang Keluar</CardTitle>
          <CardDescription>
            Perbandingan total kuantitas barang masuk (IN) dan barang keluar (OUT)
          </CardDescription>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          <Button
            type="button"
            size="sm"
            variant={range === "7d" ? "default" : "ghost"}
            onClick={() => setRange("7d")}
          >
            7 Hari Terakhir
          </Button>
          <Button
            type="button"
            size="sm"
            variant={range === "30d" ? "default" : "ghost"}
            onClick={() => setRange("30d")}
          >
            30 Hari Terakhir
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={activeData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorKeluar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="barangMasuk"
                name="Barang Masuk (IN)"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorMasuk)"
              />
              <Area
                type="monotone"
                dataKey="barangKeluar"
                name="Barang Keluar (OUT)"
                stroke="#ef4444"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorKeluar)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
