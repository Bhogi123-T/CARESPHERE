import React, { useEffect, useRef } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { cn } from './Button';

const AnimatedCounter = ({ from = 0, to, duration = 2, className, suffix = "", prefix = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  // Spring handles the smooth transition from 'from' to 'to'
  const springValue = useSpring(from, {
    stiffness: 50,
    damping: 20,
    duration: duration * 1000
  });

  // Transform maps the animated float back to a whole string
  const displayValue = useTransform(springValue, (current) => 
    `${prefix}${Math.round(current).toLocaleString()}${suffix}`
  );

  useEffect(() => {
    if (isInView) {
      springValue.set(to);
    }
  }, [isInView, springValue, to]);

  return (
    <motion.span ref={ref} className={cn("font-black tabular-nums", className)}>
      {displayValue}
    </motion.span>
  );
};

export default AnimatedCounter;
