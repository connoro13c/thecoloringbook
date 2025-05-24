'use client';

import { Check } from 'lucide-react';

interface PricingCardProps {
  title: string;
  price: number;
  features: string[];
  isPopular?: boolean;
  children?: React.ReactNode;
}

export function PricingCard({
  title,
  price,
  features,
  isPopular = false,
  children,
}: PricingCardProps) {
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className={`relative bg-white rounded-3xl border-2 p-6 transition-all hover:scale-105 ${
      isPopular 
        ? 'border-primary shadow-xl shadow-primary/20 transform scale-105' 
        : 'border-gray-200 hover:border-primary/50 shadow-lg'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            ⭐ Most Popular ⭐
          </span>
        </div>
      )}
      
      <div className="text-center pb-6">
        <div className="mb-3">
          <span className="text-4xl">{title === 'Coloring Page' ? '🎨' : '🔄'}</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <div className="text-4xl font-bold text-primary">
          {formatPrice(price)}
        </div>
      </div>
      
      <div className="space-y-4">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-gray-700 font-medium">{feature}</span>
            </li>
          ))}
        </ul>
        
        {children && (
          <div className="pt-6">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}