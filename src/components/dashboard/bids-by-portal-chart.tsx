
"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Dummy data for bids by portal
const chartData = [
  { portal: "SAM.gov", bids: 275, fill: "hsl(var(--chart-1))" }, // Using theme colors
  { portal: "SEPTA", bids: 200, fill: "hsl(var(--chart-2))" },
]

const chartConfig = {
  bids: {
    label: "Bids",
  },
  "SAM.gov": {
    label: "SAM.gov",
    color: "hsl(var(--chart-1))",
  },
  "SEPTA": {
    label: "SEPTA",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function BidsByPortalChart() {
  const totalBids = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.bids, 0)
  }, [])

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Bids by Portal</CardTitle>
        <CardDescription>Distribution of bids across portals</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
               cursor={false}
               content={({ payload }) => {
                 if (!payload?.length) return null;

                 const { portal, bids } = payload[0].payload as { portal: keyof typeof chartConfig; bids: number };
                 const percentage = totalBids > 0 ? ((bids / totalBids) * 100).toFixed(1) : 0;

                 return (
                   <div className="rounded-md border bg-background p-2 shadow-sm">
                     <div className="flex items-center gap-2 mb-1">
                       <div
                         className="h-3 w-3 rounded-full"
                         style={{ backgroundColor: chartConfig[portal]?.color }}
                       />
                       <span className="font-medium">{portal}</span>
                     </div>
                     <div className="flex flex-col text-sm">
                       <span>{bids} Bids</span>
                       <span className="text-xs text-muted-foreground">({percentage}%)</span>
                     </div>
                   </div>
                 );
               }}
             />
            <Pie
              data={chartData}
              dataKey="bids"
              nameKey="portal"
              innerRadius={60}
              strokeWidth={5}
            >
              {chartData.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill}/>
              ))}
            </Pie>
             <ChartLegend
                content={<ChartLegendContent nameKey="portal" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
