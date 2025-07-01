// Simplified Craft.js components for V1 implementation
// These components focus on JSON serialization over complex drag-and-drop

import { Container } from './Container';
import { Text } from './Text';  
import { Button } from './Button';
import { Video } from './Video';

export { Container, Text, Button, Video };

// Component registry for easy importing
export const SimpleComponents = {
  Container,
  Text,
  Button,
  Video
};

// Type exports
export type { ContainerProps } from './Container';
export type { TextProps } from './Text';
export type { ButtonProps } from './Button';
export type { VideoProps } from './Video';