'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadAnimationProps {
  imageUrl: string;
  onAnimationComplete: () => void;
  isVisible: boolean;
}

export const UploadAnimation: React.FC<UploadAnimationProps> = ({
  imageUrl,
  onAnimationComplete,
  isVisible,
}) => {
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'painting' | 'complete'>('idle');

  useEffect(() => {
    if (isVisible) {
      setAnimationPhase('painting');
      
      const timer = setTimeout(() => {
        setAnimationPhase('complete');
        setTimeout(onAnimationComplete, 500);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onAnimationComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative w-80 h-80 rounded-lg overflow-hidden shadow-2xl">
            {/* Base Image */}
            <motion.img
              src={imageUrl}
              alt="Uploaded photo"
              className="w-full h-full object-cover"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />

            {/* Watercolor Paper Texture Overlay */}
            <div className="absolute inset-0 bg-[#FCF8F3] opacity-10 mix-blend-multiply" />

            {/* Watercolor Brush Stroke Animation */}
            <AnimatePresence>
              {animationPhase === 'painting' && (
                <>
                  {/* First Stroke - Soft Indigo */}
                  <motion.div
                    className="absolute inset-0"
                    initial={{ clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
                    animate={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
                    transition={{ duration: 1, ease: "easeInOut", delay: 0.5 }}
                  >
                    <div 
                      className="w-full h-full opacity-30"
                      style={{
                        background: `linear-gradient(45deg, 
                          rgba(91, 106, 191, 0.4) 0%, 
                          rgba(217, 137, 148, 0.3) 50%, 
                          rgba(127, 190, 190, 0.4) 100%)`
                      }}
                    />
                  </motion.div>

                  {/* Watercolor Bleeding Effect */}
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5, delay: 1 }}
                  >
                    <div 
                      className="w-full h-full"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, 
                          rgba(91, 106, 191, 0.2) 0%, 
                          transparent 50%), 
                        radial-gradient(circle at 70% 70%, 
                          rgba(217, 137, 148, 0.2) 0%, 
                          transparent 50%),
                        radial-gradient(circle at 50% 90%, 
                          rgba(127, 190, 190, 0.2) 0%, 
                          transparent 50%)`
                      }}
                    />
                  </motion.div>



                  {/* Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(45deg, 
                        transparent 30%, 
                        rgba(252, 248, 243, 0.6) 50%, 
                        transparent 70%)`
                    }}
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.5, delay: 2, ease: "easeInOut" }}
                  />
                </>
              )}
            </AnimatePresence>


          </div>

          {/* Loading Text */}
          <motion.div
            className="absolute bottom-20 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.h3 
              className="text-xl font-bold text-[#404040] font-playfair mb-2"
              animate={{
                opacity: animationPhase === 'complete' ? [1, 0.7, 1] : 1,
              }}
              transition={{
                duration: 0.8,
                repeat: animationPhase === 'complete' ? 2 : 0,
              }}
            >
              {animationPhase === 'idle' && 'Preparing...'}
              {animationPhase === 'painting' && 'Creating Your Magical Coloring Page'}
              {animationPhase === 'complete' && '✨ Your Coloring Page Is Ready! ✨'}
            </motion.h3>
            
            {animationPhase !== 'complete' && (
              <div className="flex items-center justify-center space-x-2">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#5B6ABF]"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadAnimation;
