'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className = '', width = 200, height = 60 }: LogoProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark'
  const logoSrc = isDark ? '/Bnails_ white.png' : '/Bnails_dark.png';

  return (
    <Image
      src={logoSrc}
      alt="Beauty Nails Logo"
      width={width}
      height={height}
      className={`transition-all duration-300 ${className}`}
      priority
    />
  );
}
