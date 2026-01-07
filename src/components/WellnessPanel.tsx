import { WaterTracker } from './WaterTracker';
import { SleepTracker } from './SleepTracker';
import { MeditationTimer } from './MeditationTimer';
import { WellnessReport } from './WellnessReport';
import { WaterHistory } from './WaterHistory';
import { Heart } from 'lucide-react';

export function WellnessPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Heart className="h-5 w-5 text-rose-500" />
        <h2 className="text-lg font-semibold text-foreground">Wellness</h2>
      </div>
      
      {/* Trackers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <WaterTracker />
        <SleepTracker />
        <MeditationTimer />
      </div>

      {/* Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WellnessReport />
        <WaterHistory />
      </div>
    </div>
  );
}
