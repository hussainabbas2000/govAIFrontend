
"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type * as React from "react"

// Dummy data for the chart
const chartData = [
  { category: "IT Services", bids: 186 },
  { category: "Construction", bids: 305 },
  { category: "Office Supplies", bids: 237 },
  { category: "Consulting", bids: 73 },
  { category: "Maintenance", bids: 209 },
  { category: "Other", bids: 214 },
]

const chartConfig = {
  bids: {
    label: "Bids",
    color: "hsl(var(--primary))", // Use primary color from theme
  },
} satisfies ChartConfig

// Calculate total bids for percentage calculation
const totalBids = chartData.reduce((acc, curr) => acc + curr.bids, 0);

// Custom formatter for the tooltip content
const customTooltipFormatter = (value: number): React.ReactNode => {
  const percentage = totalBids > 0 ? ((value / totalBids) * 100).toFixed(1) : 0;
  return (
    <div className="flex flex-col">
      <span>{value} Bids</span>
      <span className="text-xs text-muted-foreground">({percentage}%)</span>
    </div>
  );
};


export function BidsByCategoryChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)} // Abbreviate category names if needed
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={customTooltipFormatter} // Use the custom formatter here
            />
           }
        />
        <Bar dataKey="bids" fill="var(--color-bids)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

