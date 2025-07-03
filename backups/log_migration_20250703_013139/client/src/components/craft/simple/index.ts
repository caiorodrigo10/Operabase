// Simplified Craft.js components for V1 implementation
// These components focus on JSON serialization over complex drag-and-drop

import { Container } from './Container';
import { Text } from './Text';  
import { Button } from './Button';
import { Video } from './Video';
import { HeroSection } from './HeroSection';
import { LandingCard } from './LandingCard';

export { Container, Text, Button, Video, HeroSection, LandingCard };

// Component registry for easy importing
export const SimpleComponents = {
  Container,
  Text,
  Button,
  Video,
  HeroSection,
  LandingCard
};

// Type exports
export type { ContainerProps } from './Container';
export type { TextProps } from './Text';
export type { ButtonProps } from './Button';
export type { VideoProps } from './Video';
export type { HeroSectionProps } from './HeroSection';
export type { LandingCardProps } from './LandingCard';