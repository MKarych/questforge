interface ProgressBarProps {
  current: number;
  total: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  showLabels?: boolean;
}

export default function ProgressBar({ current, total, difficulty = 'medium', showLabels = true }: ProgressBarProps) {
  const percentage = Math.min((current / total) * 100, 100);
  
  const getColor = () => {
    switch (difficulty) {
      case 'easy': return 'bg-success';
      case 'medium': return 'bg-warning';
      case 'hard': return 'bg-error';
      default: return 'bg-primary';
    }
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'easy': return 'text-success';
      case 'medium': return 'text-warning';
      case 'hard': return 'text-error';
      default: return 'text-text-secondary';
    }
  };

  const getDifficultyLabel = () => {
    switch (difficulty) {
      case 'easy': return 'Легко';
      case 'medium': return 'Средне';
      case 'hard': return 'Сложно';
      default: return '';
    }
  };

  return (
    <div className="w-full">
      {showLabels && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-primary">
            Задание {current} из {total}
          </span>
          <span className={`text-xs font-medium ${getDifficultyColor()}`}>
            {getDifficultyLabel()}
          </span>
        </div>
      )}
      
      <div className="w-full h-3 bg-surface rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {showLabels && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-text-secondary">Прогресс</span>
          <span className="text-xs text-text-secondary">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}
