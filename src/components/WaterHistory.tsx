import { useState, useEffect, useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplet, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface WaterEntry {
  date: string;
  glasses: number;
  goal: number;
}

interface ChartData {
  date: string;
  displayDate: string;
  glasses: number;
  goal: number;
}

export function WaterHistory() {
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchWaterHistory() {
      if (!user) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('water_intake')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', weekAgo)
        .order('date', { ascending: true });

      if (!error && data) {
        setEntries(data.map(w => ({
          date: w.date,
          glasses: w.glasses,
          goal: w.goal,
        })));
      }
      setLoading(false);
    }

    fetchWaterHistory();
  }, [user]);

  const last7Days = useMemo(() => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      days.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
    }
    return days;
  }, []);

  const chartData = useMemo((): ChartData[] => {
    return last7Days.map(date => {
      const entry = entries.find(e => e.date === date);
      return {
        date,
        displayDate: format(parseISO(date), 'EEE'),
        glasses: entry?.glasses ?? 0,
        goal: entry?.goal ?? 8,
      };
    });
  }, [entries, last7Days]);

  const stats = useMemo(() => {
    const validEntries = entries.filter(e => e.glasses > 0);
    if (validEntries.length === 0) return { avg: 0, total: 0, daysHitGoal: 0 };
    
    const total = validEntries.reduce((sum, e) => sum + e.glasses, 0);
    const avg = total / validEntries.length;
    const daysHitGoal = validEntries.filter(e => e.glasses >= e.goal).length;
    
    return { 
      avg: Math.round(avg * 10) / 10, 
      total, 
      daysHitGoal 
    };
  }, [entries]);

  const avgGoal = useMemo(() => {
    if (entries.length === 0) return 8;
    return Math.round(entries.reduce((sum, e) => sum + e.goal, 0) / entries.length);
  }, [entries]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-40 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplet className="h-5 w-5 text-blue-500" />
          Water Intake History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-foreground">{stats.avg}</p>
            <p className="text-xs text-muted-foreground">Avg/Day</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Week</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-foreground">{stats.daysHitGoal}</p>
            <p className="text-xs text-muted-foreground">Goals Met</p>
          </div>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => [
                  `${value} glasses`, 
                  name === 'glasses' ? 'Consumed' : 'Goal'
                ]}
              />
              <ReferenceLine 
                y={avgGoal} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="5 5"
                label={{ 
                  value: 'Goal', 
                  position: 'right',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 10,
                }}
              />
              <Bar
                dataKey="glasses"
                fill="hsl(217 91% 60%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
