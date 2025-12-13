import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { DailyProgress } from '@/types/habit';

interface WeekCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  weekProgress: DailyProgress[];
}

export function WeekCalendar({ selectedDate, onSelectDate, weekProgress }: WeekCalendarProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getProgressForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return weekProgress.find((p) => p.date === dateStr);
  };

  return (
    <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
      {days.map((day) => {
        const progress = getProgressForDate(day);
        const isSelected = isSameDay(day, selectedDate);
        const today = isToday(day);
        const completionRate = progress?.rate ?? 0;

        return (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDate(day)}
            className={cn(
              "flex-1 min-w-[40px] sm:min-w-0 flex flex-col items-center p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200",
              "hover:bg-secondary",
              isSelected && "bg-primary text-primary-foreground shadow-glow",
              !isSelected && today && "ring-2 ring-primary/30"
            )}
          >
            <span
              className={cn(
                "text-[10px] sm:text-xs font-medium uppercase",
                isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
              )}
            >
              {format(day, 'EEE')}
            </span>
            <span
              className={cn(
                "text-sm sm:text-lg font-bold mt-0.5 sm:mt-1",
                isSelected ? "text-primary-foreground" : "text-foreground"
              )}
            >
              {format(day, 'd')}
            </span>
            
            {/* Progress indicator */}
            <div className="mt-1 sm:mt-2 w-full h-1 sm:h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isSelected ? "bg-primary-foreground/80" : "bg-accent"
                )}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
