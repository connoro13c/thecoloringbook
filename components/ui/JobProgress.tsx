'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
// Removed unused icon imports - using emojis instead

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  imageUrl?: string;
  pdfUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface JobProgressProps {
  job: JobStatus | null;
  onRetry?: () => void;
}

const progressSteps = [
  { id: 1, name: '🔍 Looking at your photos', emoji: '📸', progress: 25 },
  { id: 2, name: '💭 Understanding the scene', emoji: '🧠', progress: 40 },
  { id: 3, name: '✨ Creating AI magic', emoji: '🎨', progress: 70 },
  { id: 4, name: '✏️ Drawing the lines', emoji: '✏️', progress: 85 },
  { id: 5, name: '🎉 Almost ready!', emoji: '⭐', progress: 100 },
];

export default function JobProgress({ job, onRetry }: JobProgressProps) {
  if (!job) {
    return null;
  }

  const getCurrentStep = () => {
    if (job.status === 'failed') return -1;
    if (job.status === 'completed') return progressSteps.length;
    
    const currentStep = progressSteps.findIndex(step => job.progress < step.progress);
    return currentStep === -1 ? progressSteps.length : currentStep;
  };

  const currentStepIndex = getCurrentStep();

  const getStepIcon = (stepIndex: number) => {
    const step = progressSteps[stepIndex];
    
    if (job.status === 'failed' && stepIndex === currentStepIndex) {
      return <div className="text-2xl">❌</div>;
    }
    
    if (stepIndex < currentStepIndex || job.status === 'completed') {
      return <div className="text-2xl">✅</div>;
    }
    
    if (stepIndex === currentStepIndex && job.status === 'processing') {
      return <div className="text-2xl animate-bounce">{step.emoji}</div>;
    }
    
    return <div className="text-2xl opacity-30">{step.emoji}</div>;
  };

  const getStatusMessage = () => {
    switch (job.status) {
      case 'pending':
        return 'Getting ready to create magic...';
      case 'processing': {
        const currentStep = progressSteps[Math.min(currentStepIndex, progressSteps.length - 1)];
        return currentStep?.name || 'Working on your coloring page...';
      }
      case 'completed':
        return '🎉 Your amazing coloring page is ready!';
      case 'failed':
        return job.error || 'Oops! Something went wrong. Let\'s try again!';
      default:
        return '';
    }
  };



  return (
    <div className="bg-white rounded-3xl border-2 border-primary/10 p-8 space-y-6 shadow-xl">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="text-2xl animate-pencil-draw">✏️</span>
          <h3 className="text-2xl font-bold text-gray-900">
            Creating Your Magic
          </h3>
          <span className="text-2xl animate-bounce-gentle">✨</span>
        </div>
        <p className="text-gray-600">
          Hang tight! We&apos;re turning your photos into something amazing...
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            {getStatusMessage()}
          </span>
          <span className="text-sm text-gray-500">
            {job.progress}%
          </span>
        </div>
        <Progress 
          value={job.progress} 
          className="w-full h-2"
        />
      </div>

      {/* Step Indicators */}
      <div className="space-y-3">
        {progressSteps.map((step, index) => (
          <div key={step.id} className="flex items-center space-x-3">
            {getStepIcon(index)}
            <span className={`text-sm ${
              index < currentStepIndex || job.status === 'completed'
                ? 'text-gray-900 font-medium'
                : index === currentStepIndex && job.status === 'processing'
                ? 'text-blue-600 font-medium'
                : 'text-gray-400'
            }`}>
              {step.name}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      {job.status === 'failed' && onRetry && (
        <div className="pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onRetry}
            className="w-full bg-primary text-white py-4 px-6 rounded-2xl hover:bg-primary/90 transition-all transform hover:scale-105 font-semibold touch-target"
          >
            🔄 Try Again
          </button>
        </div>
      )}

      {/* Success State */}
      {job.status === 'completed' && (job.imageUrl || job.pdfUrl) && (
        <div className="pt-4 border-t space-y-3">
          <p className="text-sm text-green-600 font-medium">
            ✨ Your coloring page has been generated successfully!
          </p>
          <div className="flex space-x-3">
            {job.imageUrl && (
              <a
                href={job.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-center hover:bg-gray-200 transition-colors text-sm"
              >
                View Image
              </a>
            )}
            {job.pdfUrl && (
              <a
                href={job.pdfUrl}
                download
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-center hover:bg-blue-700 transition-colors text-sm"
              >
                Download PDF
              </a>
            )}
          </div>
        </div>
      )}

      {/* Timing Info */}
      <div className="text-xs text-gray-400 pt-2 border-t">
        Started: {job.createdAt.toLocaleTimeString()}
        {job.completedAt && (
          <span className="ml-4">
            Completed: {job.completedAt.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}