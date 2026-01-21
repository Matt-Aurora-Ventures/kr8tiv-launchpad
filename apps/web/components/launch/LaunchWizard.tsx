'use client';

import { Check } from 'lucide-react';
import { useLaunch } from '@/hooks/useLaunch';
import { cn } from '@/lib/utils';
import { TokenInfoStep } from './TokenInfoStep';
import { TaxConfigStep } from './TaxConfigStep';
import { ReviewStep } from './ReviewStep';
import { SuccessStep } from './SuccessStep';

const steps = [
  { id: 0, name: 'Token Info', description: 'Basic token details' },
  { id: 1, name: 'Tax Config', description: 'Transaction fees' },
  { id: 2, name: 'Review', description: 'Confirm & launch' },
  { id: 3, name: 'Success', description: 'Token launched' },
];

export function LaunchWizard() {
  const { step, setStep, launchResult } = useLaunch();

  // If there's a launch result, always show success
  const currentStep = launchResult ? 3 : step;

  const goToStep = (targetStep: number) => {
    // Only allow going back to previous steps
    if (targetStep < currentStep && !launchResult) {
      setStep(targetStep);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      {currentStep < 3 && (
        <nav className="mb-8">
          <ol className="flex items-center justify-between">
            {steps.slice(0, 3).map((s, index) => {
              const isCompleted = currentStep > s.id;
              const isCurrent = currentStep === s.id;

              return (
                <li key={s.id} className="flex-1 relative">
                  {/* Connector Line */}
                  {index < steps.length - 2 && (
                    <div
                      className={cn(
                        'absolute top-5 left-[calc(50%+20px)] right-[calc(-50%+20px)] h-0.5',
                        isCompleted ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  )}

                  {/* Step */}
                  <button
                    onClick={() => goToStep(s.id)}
                    disabled={!isCompleted && !isCurrent}
                    className={cn(
                      'relative flex flex-col items-center group',
                      (isCompleted || isCurrent) && 'cursor-pointer'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                        isCompleted
                          ? 'bg-primary border-primary text-primary-foreground'
                          : isCurrent
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">{s.id + 1}</span>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          isCurrent ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {s.name}
                      </p>
                      <p className="text-xs text-muted-foreground hidden sm:block">
                        {s.description}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* Step Content */}
      <div className="card">
        {currentStep === 0 && <TokenInfoStep onNext={() => setStep(1)} />}
        {currentStep === 1 && (
          <TaxConfigStep onNext={() => setStep(2)} onBack={() => setStep(0)} />
        )}
        {currentStep === 2 && <ReviewStep onBack={() => setStep(1)} />}
        {currentStep === 3 && <SuccessStep />}
      </div>
    </div>
  );
}

export default LaunchWizard;
