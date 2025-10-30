'use client'

import React from 'react'
import { formatCurrency } from '@/lib/currency'

interface PriceDisplayProps {
  amount: number
  showUSD?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PriceDisplay({ 
  amount, 
  showUSD = false, 
  className = '', 
  size = 'md' 
}: PriceDisplayProps) {
  const { idr, usd } = formatCurrency(amount);
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  };

  if (showUSD) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className={`${sizeClasses[size]} font-bold text-white`}>
          {idr}
        </div>
        <div className={`${sizeClasses[size] === 'text-xl' ? 'text-sm' : sizeClasses[size] === 'text-lg' ? 'text-xs' : 'text-xs'} text-gray-400`}>
          ≈ {usd}
        </div>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} font-bold text-white ${className}`}>
      {idr}
    </div>
  );
}