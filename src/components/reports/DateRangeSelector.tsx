"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getPresetDateRanges, formatDateForAPI } from "@/lib/utils/dateRange";

interface DateRangeSelectorProps {
  dateFrom: Date;
  dateTo: Date;
  onChange: (dateFrom: Date, dateTo: Date) => void;
  className?: string;
}

export function DateRangeSelector({
  dateFrom,
  dateTo,
  onChange,
  className,
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(dateFrom);
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(dateTo);

  const presets = getPresetDateRanges();

  const handlePresetClick = (preset: { dateFrom: Date; dateTo: Date }) => {
    onChange(preset.dateFrom, preset.dateTo);
  };

  const handleCustomApply = () => {
    if (customDateFrom && customDateTo) {
      onChange(customDateFrom, customDateTo);
      setIsOpen(false);
    }
  };

  const isCurrentRange = (preset: { dateFrom: Date; dateTo: Date }) => {
    return (
      formatDateForAPI(preset.dateFrom) === formatDateForAPI(dateFrom) &&
      formatDateForAPI(preset.dateTo) === formatDateForAPI(dateTo)
    );
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Preset Buttons */}
      {presets.slice(0, 5).map((preset, index) => (
        <Button
          key={index}
          variant={isCurrentRange(preset) ? "default" : "outline"}
          size="sm"
          onClick={() => handlePresetClick(preset)}
        >
          {preset.label}
        </Button>
      ))}

      {/* Custom Date Range Picker */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Custom
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Calendar
                mode="single"
                selected={customDateFrom}
                onSelect={setCustomDateFrom}
                initialFocus
                disabled={(date) => date > new Date()}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Calendar
                mode="single"
                selected={customDateTo}
                onSelect={setCustomDateTo}
                disabled={(date) =>
                  date > new Date() || (customDateFrom ? date < customDateFrom : false)
                }
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                size="sm"
                onClick={handleCustomApply}
                disabled={!customDateFrom || !customDateTo}
                className="flex-1"
              >
                Apply
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Current Range Display */}
      <div className="text-sm text-muted-foreground ml-auto hidden sm:block">
        {format(dateFrom, "MMM dd, yyyy")} - {format(dateTo, "MMM dd, yyyy")}
      </div>
    </div>
  );
}
