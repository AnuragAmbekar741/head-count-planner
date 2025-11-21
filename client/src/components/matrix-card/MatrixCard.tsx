import React from "react";

interface MatrixCardProps {
  value: string;
  label: string;
  valueColor?: string;
  badge?: React.ReactNode;
  className?: string;
}

export function MatrixCard({
  value,
  label,
  valueColor,
  badge,
  className = "",
}: MatrixCardProps) {
  return (
    <div
      className={`w-[19.5%] rounded-lg border bg-card relative ${className}`}
    >
      <div className="py-2 px-4">
        <div className="space-y-1">
          <div className="flex items-start justify-between">
            <div className={`text-xl font-bold ${valueColor || ""}`}>
              {value}
            </div>
            {badge && <div className="absolute top-2 right-2">{badge}</div>}
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}
