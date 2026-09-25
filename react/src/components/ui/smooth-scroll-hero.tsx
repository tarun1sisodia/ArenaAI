"use client";
import * as React from "react";
import {
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "framer-motion";

export interface iISmoothScrollHeroProps {
  /**
   * Height of the scroll section in pixels
   * @default 1500
   */
  scrollHeight?: number;
  /**
   * Background image URL for desktop view
   * @default "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2400&q=85"
   */
  desktopImage?: string;
  /**
   * Background image URL for mobile view
   * @default "https://images.unsplash.com/photo-1658313286353-81f8cf3a328a?auto=format&fit=crop&w=1200&q=85"
   */
  mobileImage?: string;
  /**
   * Initial clip path percentage
   * @default 25
   */
  initialClipPercentage?: number;
  /**
   * Final clip path percentage
   * @default 75
   */
  finalClipPercentage?: number;
  /**
   * Optional children to render inside the hero overlay
   */
  children?: React.ReactNode;
}

export interface iISmoothScrollHeroBackgroundProps extends iISmoothScrollHeroProps {}

const SmoothScrollHeroBackground: React.FC<
  iISmoothScrollHeroBackgroundProps
> = ({
  scrollHeight = 1500,
  desktopImage = "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2400&q=85",
  mobileImage = "https://images.unsplash.com/photo-1658313286353-81f8cf3a328a?auto=format&fit=crop&w=1200&q=85",
  initialClipPercentage = 25,
  finalClipPercentage = 75,
  children,
}) => {
  const { scrollY } = useScroll();

  const clipStart = useTransform(
    scrollY,
    [0, scrollHeight],
    [initialClipPercentage, 0],
  );
  const clipEnd = useTransform(
    scrollY,
    [0, scrollHeight],
    [finalClipPercentage, 100],
  );

  const clipPath = useMotionTemplate`polygon(${clipStart}% ${clipStart}%, ${clipEnd}% ${clipStart}%, ${clipEnd}% ${clipEnd}%, ${clipStart}% ${clipEnd}%)`;

  const backgroundSize = useTransform(
    scrollY,
    [0, scrollHeight + 500],
    ["170%", "100%"],
  );

  // Overlay fade out near the end of the scroll
  const overlayOpacity = useTransform(
    scrollY,
    [scrollHeight * 0.8, scrollHeight],
    [1, 0]
  );

  return (
    <motion.div
      className="sticky top-0 h-screen w-full bg-ink-midnight overflow-hidden"
      style={{
        clipPath,
        willChange: "transform, opacity",
      }}
    >
      {/* Mobile background */}
      <motion.div
        className="absolute inset-0 md:hidden bg-cover bg-center"
        style={{
          backgroundImage: `url(${mobileImage})`,
          backgroundSize,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Desktop background */}
      <motion.div
        className="absolute inset-0 hidden md:block bg-cover bg-center"
        style={{
          backgroundImage: `url(${desktopImage})`,
          backgroundSize,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Atmospheric dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-midnight via-ink-midnight/40 to-transparent pointer-events-none" />

      {/* Hero content / callout overlay */}
      {children && (
        <motion.div
          className="relative z-10 h-full w-full flex flex-col items-center justify-center pointer-events-none"
          style={{ opacity: overlayOpacity }}
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
};

/**
 * A smooth scroll hero component with parallax background effect
 * @param props - Component props
 * @returns React component
 */
export const SmoothScrollHero: React.FC<iISmoothScrollHeroProps> = ({
  scrollHeight = 1500,
  desktopImage = "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2400&q=85",
  mobileImage = "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=85",
  initialClipPercentage = 25,
  finalClipPercentage = 75,
  children,
}) => {
  return (
    <div
      style={{ height: `calc(${scrollHeight}px + 100vh)` }}
      className="relative w-full"
    >
      <SmoothScrollHeroBackground
        scrollHeight={scrollHeight}
        desktopImage={desktopImage}
        mobileImage={mobileImage}
        initialClipPercentage={initialClipPercentage}
        finalClipPercentage={finalClipPercentage}
      >
        {children}
      </SmoothScrollHeroBackground>
    </div>
  );
};

export default SmoothScrollHero;
