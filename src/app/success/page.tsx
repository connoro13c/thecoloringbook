import { Suspense } from 'react';
import { SuccessPageContent } from './SuccessPageContent';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <SuccessPageContent />
        </Suspense>
      </div>
    </div>
  );
}
