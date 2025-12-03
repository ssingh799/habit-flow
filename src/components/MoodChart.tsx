import { DailyMoodData } from '@/hooks/useMood';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface MoodChartProps {
  data: DailyMoodData[];
  height?: number;
}

const getMoodColor = (mood: number | null) => {
  if (mood === null) return 'hsl(var(--muted))';
  if (mood <= 3) return 'hsl(var(--destructive))';
  if (mood <= 6) return 'hsl(var(--warning))';
  return 'hsl(var(--accent))';
};

export function MoodChart({ data, height = 200 }: MoodChartProps) {
  // Filter out null values for the chart but keep the dates
  const chartData = data.map(d => ({
    ...d,
    moodDisplay: d.mood,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DailyMoodData;
      if (data.mood === null) {
        return (
          <div className="bg-card p-3 rounded-lg shadow-lg border border-border">
            <p className="font-semibold text-foreground">{data.displayDate}</p>
            <p className="text-sm text-muted-foreground">No mood recorded</p>
          </div>
        );
      }
      return (
        <div className="bg-card p-3 rounded-lg shadow-lg border border-border">
          <p className="font-semibold text-foreground">{data.displayDate}</p>
          <p className="text-sm font-medium" style={{ color: getMoodColor(data.mood) }}>
            Mood: {data.mood}/10
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.mood === null) return null;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={getMoodColor(payload.mood)}
        stroke="hsl(var(--background))"
        strokeWidth={2}
      />
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="displayDate"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[1, 10]}
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          ticks={[1, 5, 10]}
        />
        <ReferenceLine y={5} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="mood"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#moodGradient)"
          dot={<CustomDot />}
          activeDot={{ r: 7, fill: 'hsl(var(--primary))' }}
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
