"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

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
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="bids" fill="var(--color-bids)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
