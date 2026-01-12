import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Activity } from 'lucide-react';

interface BMIChartProps {
  weight: number | null;
  height: number | null;
}

interface BMICategory {
  label: string;
  min: number;
  max: number;
  color: string;
  bgColor: string;
}

const BMI_CATEGORIES: BMICategory[] = [
  { label: 'Underweight', min: 0, max: 18.5, color: 'text-blue-600', bgColor: 'bg-blue-500' },
  { label: 'Normal', min: 18.5, max: 25, color: 'text-green-600', bgColor: 'bg-green-500' },
  { label: 'Overweight', min: 25, max: 30, color: 'text-yellow-600', bgColor: 'bg-yellow-500' },
  { label: 'Obese', min: 30, max: 100, color: 'text-red-600', bgColor: 'bg-red-500' },
];

export function BMIChart({ weight, height }: BMIChartProps) {
  const bmiData = useMemo(() => {
    if (!weight || !height || height === 0) return null;
    
    // BMI = weight (kg) / height (m)²
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    const roundedBMI = Math.round(bmi * 10) / 10;
    
    const category = BMI_CATEGORIES.find(cat => bmi >= cat.min && bmi < cat.max) || BMI_CATEGORIES[3];
    
    // Calculate position on scale (0-40 BMI range mapped to 0-100%)
    const position = Math.min(Math.max((bmi / 40) * 100, 0), 100);
    
    return { bmi: roundedBMI, category, position };
  }, [weight, height]);

  if (!bmiData) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Body Mass Index (BMI)
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Enter your weight and height to calculate BMI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            Complete your fitness data above to see your BMI
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Body Mass Index (BMI)
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Your current BMI based on weight and height
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* BMI Value Display */}
        <div className="text-center">
          <div className={`text-5xl font-bold ${bmiData.category.color}`}>
            {bmiData.bmi}
          </div>
          <div className={`text-lg font-medium mt-1 ${bmiData.category.color}`}>
            {bmiData.category.label}
          </div>
        </div>

        {/* BMI Scale */}
        <div className="space-y-2">
          <div className="relative h-6 rounded-full overflow-hidden flex">
            {BMI_CATEGORIES.map((cat, index) => {
              const width = index === 0 
                ? (18.5 / 40) * 100 
                : index === 1 
                  ? ((25 - 18.5) / 40) * 100 
                  : index === 2 
                    ? ((30 - 25) / 40) * 100 
                    : ((40 - 30) / 40) * 100;
              
              return (
                <div
                  key={cat.label}
                  className={`h-full ${cat.bgColor} opacity-80`}
                  style={{ width: `${width}%` }}
                />
              );
            })}
            {/* BMI Indicator */}
            <div
              className="absolute top-0 h-full w-1 bg-foreground shadow-lg transition-all duration-500"
              style={{ left: `calc(${bmiData.position}% - 2px)` }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-0.5 rounded whitespace-nowrap">
                {bmiData.bmi}
              </div>
            </div>
          </div>
          
          {/* Scale Labels */}
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>0</span>
            <span>18.5</span>
            <span>25</span>
            <span>30</span>
            <span>40+</span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {BMI_CATEGORIES.map((cat) => (
            <div key={cat.label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${cat.bgColor}`} />
              <span className="text-muted-foreground">
                {cat.label} ({cat.min === 0 ? '<' : ''}{cat.min === 0 ? cat.max : `${cat.min}-${cat.max === 100 ? '+' : cat.max}`})
              </span>
            </div>
          ))}
        </div>

        {/* Health Tips */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
          {bmiData.bmi < 18.5 && (
            <p>💡 Consider consulting a nutritionist to help reach a healthier weight.</p>
          )}
          {bmiData.bmi >= 18.5 && bmiData.bmi < 25 && (
            <p>✨ Great job! Your BMI is in the healthy range. Keep maintaining your lifestyle!</p>
          )}
          {bmiData.bmi >= 25 && bmiData.bmi < 30 && (
            <p>💪 Regular exercise and balanced diet can help you reach a healthier weight.</p>
          )}
          {bmiData.bmi >= 30 && (
            <p>❤️ Consider consulting a healthcare provider for personalized advice.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
