
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface TopPerformer {
  id: string;
  name: string;
  value: number;
  link?: string;
}

interface TopPerformersCardProps {
  title: string;
  items: TopPerformer[];
  emptyMessage?: string;
}

export function TopPerformersCard({
  title,
  items,
  emptyMessage = "No data available",
}: TopPerformersCardProps) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-xs font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  {item.link ? (
                    <Link
                      href={item.link}
                      className="text-sm font-medium hover:underline truncate block"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <div className="text-sm font-medium truncate">{item.name}</div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(item.value / maxValue) * 100}%`,
                        minWidth: "4px",
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{item.value}</span>
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
