interface ProgressBarProps {
  progress: number;
  currentStep: number;
  category: string;
}

export function ProgressBar({ progress, currentStep, category }: ProgressBarProps) {
  return (
    <div className="progress-container">
      <div className="progress-info">
        <span className="progress-step">步骤 {currentStep}</span>
        <span className="progress-category">{category}</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

