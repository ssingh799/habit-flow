import { useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSleep } from '@/hooks/useSleep';
import { useWaterIntake } from '@/hooks/useWaterIntake';
import { useMeditation } from '@/hooks/useMeditation';
import { Droplet, Moon, Brain, TrendingUp, Calendar } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface DayData {
  date: string;
  displayDate: string;
  value: number;
}

function generateLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
  }
  return days;
}

export function WellnessReport() {
  const { entries: sleepEntries, loading: sleepLoading } = useSleep();
  const { getDailyStats: getMeditationStats, loading: meditationLoading } = useMeditation();

  const last7Days = useMemo(() => generateLast7Days(), []);

  const sleepData = useMemo((): DayData[] => {
    return last7Days.map(date => {
      const entry = sleepEntries.find(e => e.date === date);
      return {
        date,
        displayDate: format(parseISO(date), 'EEE'),
        value: entry?.durationHours ?? 0,
      };
    });
  }, [sleepEntries, last7Days]);

  const sleepQualityData = useMemo((): DayData[] => {
    return last7Days.map(date => {
      const entry = sleepEntries.find(e => e.date === date);
      return {
        date,
        displayDate: format(parseISO(date), 'EEE'),
        value: entry?.quality ?? 0,
      };
    });
  }, [sleepEntries, last7Days]);

  const meditationData = useMemo((): DayData[] => {
    const stats = getMeditationStats();
    return last7Days.map(date => {
      const entry = stats.find(s => s.date === date);
      return {
        date,
        displayDate: format(parseISO(date), 'EEE'),
        value: entry?.minutes ?? 0,
      };
    });
  }, [getMeditationStats, last7Days]);

  const sleepStats = useMemo(() => {
    const validEntries = sleepEntries.filter(e => e.durationHours !== null);
    if (validEntries.length === 0) return { avg: 0, total: 0, best: 0 };
    
    const total = validEntries.reduce((sum, e) => sum + (e.durationHours ?? 0), 0);
    const avg = total / validEntries.length;
    const best = Math.max(...validEntries.map(e => e.durationHours ?? 0));
    
    return { avg: Math.round(avg * 10) / 10, total: Math.round(total * 10) / 10, best };
  }, [sleepEntries]);

  const meditationStats = useMemo(() => {
    const stats = getMeditationStats();
    const total = stats.reduce((sum, s) => sum + s.minutes, 0);
    const avg = stats.length > 0 ? total / stats.length : 0;
    const best = stats.length > 0 ? Math.max(...stats.map(s => s.minutes)) : 0;
    
    return { avg: Math.round(avg), total, best };
  }, [getMeditationStats]);

  const isLoading = sleepLoading || meditationLoading;

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-40 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Wellness Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sleep" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sleep" className="gap-1">
              <Moon className="h-4 w-4" />
              <span className="hidden sm:inline">Sleep</span>
            </TabsTrigger>
            <TabsTrigger value="meditation" className="gap-1">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Meditation</span>
            </TabsTrigger>
            <TabsTrigger value="quality" className="gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Quality</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sleep" className="space-y-4">
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-foreground">{sleepStats.avg}h</p>
                <p className="text-xs text-muted-foreground">Avg/Night</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-foreground">{sleepStats.total}h</p>
                <p className="text-xs text-muted-foreground">Total Week</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-foreground">{sleepStats.best}h</p>
                <p className="text-xs text-muted-foreground">Best Night</p>
              </div>
            </div>
            
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sleepData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    domain={[0, 12]}
                    tickFormatter={(v) => `${v}h`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}h`, 'Sleep']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="meditation" className="space-y-4">
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-foreground">{meditationStats.avg}m</p>
                <p className="text-xs text-muted-foreground">Avg/Day</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-foreground">{meditationStats.total}m</p>
                <p className="text-xs text-muted-foreground">Total Week</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-foreground">{meditationStats.best}m</p>
                <p className="text-xs text-muted-foreground">Best Day</p>
              </div>
            </div>
            
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={meditationData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickFormatter={(v) => `${v}m`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value} min`, 'Meditation']}
                  />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            <p className="text-sm text-muted-foreground mt-4">
              Sleep quality rating over the past week (1-5 stars)
            </p>
            
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sleepQualityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    domain={[0, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}/5`, 'Quality']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--chart-4))"
                    fill="hsl(var(--chart-4) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
