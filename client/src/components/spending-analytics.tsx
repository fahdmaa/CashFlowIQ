import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useState } from "react";

export default function SpendingAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState(7);

  const { data: spendingData, isLoading } = useQuery({
    queryKey: ["/api/analytics/spending", { days: selectedPeriod }],
  });

  // Debug logging
  console.log('SpendingAnalytics: selectedPeriod =', selectedPeriod);
  console.log('SpendingAnalytics: spendingData =', spendingData);
  console.log('SpendingAnalytics: isLoading =', isLoading);

  if (isLoading) {
    return (
      <Card className="rounded-xl">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-40" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Transform data for chart
  const chartData = Object.entries(spendingData || {})
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB)) // Sort by date ascending
    .map(([date, amount]) => {
      const dateObj = new Date(date);
      const label = selectedPeriod <= 7 
        ? dateObj.toLocaleDateString('en-US', { weekday: 'short' }) // Show weekday for 7 days or less
        : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // Show month/day for longer periods
      
      return {
        date: label,
        spending: amount,
        fullDate: date, // Keep original date for sorting/debugging
      };
    });

  console.log('SpendingAnalytics: chartData =', chartData);

  return (
    <Card className="rounded-xl animate-fadeIn hover-lift transition-all" style={{animationDelay: '300ms'}}>
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">Spending Analytics</CardTitle>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant={selectedPeriod === 7 ? "default" : "outline"}
              onClick={() => setSelectedPeriod(7)}
              className={`transition-all hover:scale-105 ${selectedPeriod === 7 ? "bg-primary text-white" : ""}`}
              data-testid="button-period-7days"
            >
              7 Days
            </Button>
            <Button
              size="sm"
              variant={selectedPeriod === 30 ? "default" : "outline"}
              onClick={() => setSelectedPeriod(30)}
              className={`transition-all hover:scale-105 ${selectedPeriod === 30 ? "bg-primary text-white" : ""}`}
              data-testid="button-period-30days"
            >
              30 Days
            </Button>
            <Button
              size="sm"
              variant={selectedPeriod === 90 ? "default" : "outline"}
              onClick={() => setSelectedPeriod(90)}
              className={`transition-all hover:scale-105 ${selectedPeriod === 90 ? "bg-primary text-white" : ""}`}
              data-testid="button-period-90days"
            >
              90 Days
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-64" data-testid="chart-spending-analytics">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No spending data available for the selected period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  tickFormatter={(value) => `${value} DH`}
                />
                <Line
                  type="monotone"
                  dataKey="spending"
                  stroke="hsl(247.0588 88.8889% 70.1961%)"
                  strokeWidth={3}
                  fill="rgba(99, 102, 241, 0.1)"
                  dot={{
                    fill: "hsl(247.0588 88.8889% 70.1961%)",
                    stroke: "#ffffff",
                    strokeWidth: 2,
                    r: 5
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}