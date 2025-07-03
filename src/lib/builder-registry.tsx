import { Builder } from '@builder.io/react';
import { Button } from '@/components/ui/button';
import { ProductImage } from '@/components/ProductImage';
import { ProductDetails } from '@/components/ProductDetails';
import { VideoPlayer } from '@/components/ui/video-player';
import { Card } from '@/components/ui/card';
import { FeatureShowcase } from '@/components/ui/feature-showcase';
import { HomeHero } from '@/components/HomeHero';

// Register your components so they can be used in the Builder.io editor
// This makes your components available in the Builder.io visual editor

// Register Button component
Builder.registerComponent(Button, {
  name: 'Button',
  inputs: [
    { name: 'children', type: 'text', defaultValue: 'Click me' },
    { name: 'variant', type: 'enum', enum: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'], defaultValue: 'default' },
    { name: 'size', type: 'enum', enum: ['default', 'sm', 'lg', 'icon'], defaultValue: 'default' },
    { name: 'className', type: 'string' },
  ],
});

// Register ProductImage component
Builder.registerComponent(ProductImage, {
  name: 'ProductImage',
  inputs: [
    { name: 'url', type: 'string', required: true },
    { name: 'alt', type: 'string', defaultValue: 'Product image' },
    { name: 'width', type: 'number', defaultValue: 500 },
    { name: 'height', type: 'number', defaultValue: 500 },
    { name: 'size', type: 'enum', enum: ['small', 'medium', 'large'], defaultValue: 'medium' },
    { name: 'priority', type: 'boolean', defaultValue: false },
    { name: 'className', type: 'string' },
    { name: 'aspectRatio', type: 'enum', enum: ['square', 'portrait', 'landscape'], defaultValue: 'square' },
  ],
});

// Register VideoPlayer component
Builder.registerComponent(VideoPlayer, {
  name: 'VideoPlayer',
  inputs: [
    { name: 'src', type: 'string', required: true },
    { name: 'poster', type: 'string' },
  ],
});

// Register Card component
Builder.registerComponent(Card, {
  name: 'Card',
  inputs: [
    { name: 'className', type: 'string' },
    { name: 'children', type: 'jsx' },
  ],
});

// Register FeatureShowcase component
Builder.registerComponent(FeatureShowcase, {
  name: 'FeatureShowcase',
  inputs: [
    { name: 'title', type: 'string', defaultValue: 'Feature Title' },
    { name: 'description', type: 'text', defaultValue: 'This is a description of the feature. Explain what makes this feature special and why customers should care about it.' },
    { name: 'imageUrl', type: 'file', allowedFileTypes: ['jpeg', 'jpg', 'png', 'webp'] },
    { name: 'iconName', type: 'string', helperText: 'Lucide icon name (e.g., "ShoppingBag", "Heart", "Truck")' },
    { name: 'layout', type: 'enum', enum: ['left', 'right'], defaultValue: 'left' },
    { name: 'bgColor', type: 'string', defaultValue: 'bg-background' },
    { name: 'textColor', type: 'string', defaultValue: 'text-foreground' },
    { name: 'className', type: 'string' },
  ],
});

// Register HomeHero component
Builder.registerComponent(HomeHero, {
  name: 'HomeHero',
  inputs: [
    { name: 'title', type: 'string', defaultValue: 'Stylish Tote Bags for Every Occasion' },
    { name: 'subtitle', type: 'text', defaultValue: 'Handcrafted with premium materials for durability and style' },
    { name: 'buttonText', type: 'string', defaultValue: 'Shop Now' },
    { name: 'buttonLink', type: 'string', defaultValue: '/shop' },
    { name: 'backgroundImage', type: 'file', allowedFileTypes: ['jpeg', 'jpg', 'png', 'webp'] },
    { name: 'overlayColor', type: 'string', defaultValue: 'rgba(0, 0, 0, 0.4)' },
    { name: 'textColor', type: 'string', defaultValue: 'text-white' },
  ],
});

// Add more component registrations as needed
