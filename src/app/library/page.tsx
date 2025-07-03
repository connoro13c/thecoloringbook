import { Suspense } from 'react';
import { LibraryContent } from './LibraryContent';

export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Library</h1>
            <p className="text-lg text-gray-600">
              Access all your downloaded coloring pages
            </p>
          </div>

          <Suspense fallback={<div className="text-center">Loading your library...</div>}>
            <LibraryContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
