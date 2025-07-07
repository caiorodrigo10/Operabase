import React from "react";
import { Card, CardContent } from "./ui/card";

interface CalendarSkeletonProps {
  showProgress?: boolean;
  progressText?: string;
}

export function CalendarSkeleton({ 
  showProgress = true, 
  progressText = "Carregando agenda..." 
}: CalendarSkeletonProps) {
  return (
    <div className="p-4 lg:p-6">
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto"></div>
              {showProgress && (
                <div className="space-y-2">
                  <div className="text-sm text-slate-600 font-medium">{progressText}</div>
                  <div className="text-xs text-slate-500">
                    Sincronizando profissionais e consultas
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CalendarSkeleton; 