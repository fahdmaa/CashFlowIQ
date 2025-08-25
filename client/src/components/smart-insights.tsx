import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, TrendingUp, BarChart3, Lightbulb } from "lucide-react";

const insightIcons = {
  warning: AlertTriangle,
  success: TrendingUp,
  info: BarChart3,
};

const insightColors = {
  warning: "bg-warning/5 border-l-4 border-warning",
  success: "bg-secondary/5 border-l-4 border-secondary",
  info: "bg-primary/5 border-l-4 border-primary",
};

const iconColors = {
  warning: "text-warning",
  success: "text-secondary",
  info: "text-primary",
};

export default function SmartInsights() {
  const { data: insights, isLoading } = useQuery<any[]>({
    queryKey: ["/api/insights"],
  });

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-r-lg border-l-4 border-gray-200">
                <div className="flex items-start space-x-3">
                  <Skeleton className="w-5 h-5 mt-1" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">Smart Insights</CardTitle>
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Lightbulb className="text-primary h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {insights?.length === 0 ? (
            <div className="text-center py-8 text-gray-500" data-testid="text-no-insights">
              No insights available yet. Add some transactions to get personalized insights!
            </div>
          ) : (
            insights?.map((insight: any) => {
              const IconComponent = insightIcons[insight.type as keyof typeof insightIcons] || BarChart3;
              const containerColor = insightColors[insight.type as keyof typeof insightColors] || "bg-primary/5 border-l-4 border-primary";
              const iconColor = iconColors[insight.type as keyof typeof iconColors] || "text-primary";
              
              return (
                <div 
                  key={insight.id} 
                  className={`${containerColor} p-4 rounded-r-lg`}
                  data-testid={`insight-${insight.id}`}
                >
                  <div className="flex items-start space-x-3">
                    <IconComponent className={`${iconColor} mt-1 h-5 w-5`} />
                    <div>
                      <p className="font-medium text-foreground" data-testid={`text-insight-title-${insight.id}`}>
                        {insight.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1" data-testid={`text-insight-message-${insight.id}`}>
                        {insight.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
