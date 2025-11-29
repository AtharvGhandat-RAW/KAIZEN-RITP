import React, { memo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export const AtmosphericBackground = memo(function AtmosphericBackground() {
  const isMobile = useIsMobile();

  // On mobile OR for performance, just use a static gradient - no animations
  // This dramatically improves scrolling performance
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at top right, rgba(127, 29, 29, 0.15) 0%, transparent 50%)',
        }}
      />
      {/* Single subtle ambient glow - no blur filter */}
      {!isMobile && (
        <div
          className="absolute left-[30%] top-[40%] w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle at center, rgba(127, 29, 29, 0.3) 0%, transparent 70%)',
          }}
        />
      )}
    </div>
  );
});
