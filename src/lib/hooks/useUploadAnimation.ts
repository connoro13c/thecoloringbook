'use client';

import { useState, useCallback } from 'react';

export interface UploadAnimationState {
  isVisible: boolean;
  imageUrl: string | null;
}

export const useUploadAnimation = () => {
  const [animationState, setAnimationState] = useState<UploadAnimationState>({
    isVisible: false,
    imageUrl: null,
  });

  const startAnimation = useCallback((imageUrl: string) => {
    setAnimationState({
      isVisible: true,
      imageUrl,
    });
  }, []);

  const stopAnimation = useCallback(() => {
    setAnimationState({
      isVisible: false,
      imageUrl: null,
    });
  }, []);

  const onAnimationComplete = useCallback(() => {
    stopAnimation();
  }, [stopAnimation]);

  return {
    animationState,
    startAnimation,
    stopAnimation,
    onAnimationComplete,
  };
};

export default useUploadAnimation;
