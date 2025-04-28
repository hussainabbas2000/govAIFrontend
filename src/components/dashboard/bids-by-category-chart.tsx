
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, Cell } from "recharts" // Added Cell import

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type * as React from "react"

// Dummy data for the chart
const chartData = [
  { category: "IT Services", bids: 186, fill: "hsl(var(--chart-1))" }, // Use chart colors from theme
  { category: "Construction", bids: 305, fill: "hsl(var(--chart-2))" },
  { category: "Office Supplies", bids: 237, fill: "hsl(var(--chart-3))" },
  { category: "Consulting", bids: 73, fill: "hsl(var(--chart-4))" },
  { category: "Maintenance", bids: 209, fill: "hsl(var(--chart-5))" },
  { category: "Other", bids: 214, fill: "hsl(var(--accent))" }, // Use accent for the last one
]

const chartConfig = {
  bids: {
    label: "Bids",
  },
  // Define labels for legend/tooltip if needed, using category names as keys
  "IT Services": { label: "IT Services", color: "hsl(var(--chart-1))" },
  "Construction": { label: "Construction", color: "hsl(var(--chart-2))" },
  "Office Supplies": { label: "Office Supplies", color: "hsl(var(--chart-3))" },
  "Consulting": { label: "Consulting", color: "hsl(var(--chart-4))" },
  "Maintenance": { label: "Maintenance", color: "hsl(var(--chart-5))" },
  "Other": { label: "Other", color: "hsl(var(--accent))" },
} satisfies ChartConfig

// Calculate total bids for percentage calculation
const totalBids = chartData.reduce((acc, curr) => acc + curr.bids, 0);

export function BidsByCategoryChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="category"
          tickLine={false}
          tickMargin={20}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)} // Abbreviate category names if needed
        />
        <ChartTooltip
          cursor={false}
          content={({ payload }) => {
            if (!payload?.length) return null;
        
            const { category, bids } = payload[0].payload as { category: keyof typeof chartConfig; bids: number; };

            const percentage = totalBids > 0 ? ((bids / totalBids) * 100).toFixed(1) : 0;
        
            return (
              <div className="rounded-md border bg-background p-2 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  {/* Little colored circle */}
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{backgroundColor: chartConfig[category]?.color}}
                  />
                  <span className="font-medium">{category}</span>
                </div>
                <div className="flex flex-col">
                  <span>{bids} Bids</span>
                  <span className="text-xs text-muted-foreground">({percentage}%)</span>
                </div>
              </div>
            );
          }}
        />
        <Bar dataKey="bids" radius={4}>
           {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

