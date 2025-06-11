import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardInfoProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function CardInfo({ title, value, subtitle, icon: Icon, iconColor = "bg-blue-100 text-medical-blue", trend }: CardInfoProps) {
  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
            {trend && (
              <p className={cn(
                "text-sm mt-1",
                trend.isPositive ? "text-medical-green" : "text-red-500"
              )}>
                <span className="mr-1">
                  {trend.isPositive ? "↗" : "↘"}
                </span>
                {trend.value}
              </p>
            )}
            {subtitle && !trend && (
              <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconColor)}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
