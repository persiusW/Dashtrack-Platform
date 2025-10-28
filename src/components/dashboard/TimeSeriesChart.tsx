
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeSeriesData } from "@/services/dashboardService";

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
  title?: string;
}

export function TimeSeriesChart({ data, title = "Valid Clicks Over Time" }: TimeSeriesChartProps) {
  const maxValue = Math.max(...data.map((d) => d.validClicks), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No data available for the selected period
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((item) => (
              <div key={item.date} className="flex items-center gap-4">
                <div className="text-xs text-muted-foreground w-24">
                  {new Date(item.date).toLocaleDateString()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="bg-blue-500 h-6 rounded transition-all"
                      style={{
                        width: `${(item.validClicks / maxValue) * 100}%`,
                        minWidth: "2px",
                      }}
                    />
                    <span className="text-sm font-medium">{item.validClicks}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
