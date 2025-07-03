# Konipai Homepage Builder.io Integration Guide

This guide explains how to use Builder.io to visually edit the Konipai homepage content.

## Overview

The Konipai homepage now supports visual editing through Builder.io. Two main sections can be edited:

1. **Hero Section** - The main banner at the top of the homepage
2. **Features Section** - The "Why Choose Konipai" section

## Setting Up Content Models in Builder.io

Before you can edit the homepage content, you need to create the appropriate content models in Builder.io:

### 1. Create the "home-hero" Model

1. Log in to your Builder.io account
2. Go to Models → Create Model
3. Name: `home-hero`
4. Description: "Homepage hero section"
5. Enable "Is page" toggle: OFF
6. Click "Create"

### 2. Create the "home-features" Model

1. Go to Models → Create Model
2. Name: `home-features`
3. Description: "Homepage features section"
4. Enable "Is page" toggle: OFF
5. Click "Create"

## Creating Content in Builder.io

### Creating a Hero Section

1. Go to Content → Create Content
2. Select the `home-hero` model
3. Name your content (e.g., "Homepage Hero")
4. In the visual editor, you can:
   - Drag and drop the `HomeHero` component from the Components panel
   - Customize the title, subtitle, button text, background image, etc.
   - Preview how it looks on different devices

### Creating a Features Section

1. Go to Content → Create Content
2. Select the `home-features` model
3. Name your content (e.g., "Homepage Features")
4. In the visual editor, you can:
   - Drag and drop components like `FeatureShowcase` or other UI elements
   - Arrange them in a grid or other layout
   - Customize text, images, and colors

## How It Works

The homepage (`Index.tsx`) now includes Builder.io integration:

1. It fetches content for both the hero and features sections using the Builder.io API
2. If content exists in Builder.io, it displays that content
3. If no content exists, it falls back to the default static components

## Available Components

The following custom components are registered with Builder.io and available for use:

- `HomeHero` - A customizable hero banner with title, subtitle, button, and background image
- `Button` - Standard UI button with various styles
- `ProductImage` - Component for displaying product images
- `VideoPlayer` - Component for embedding videos
- `Card` - Versatile card component for content display
- `FeatureShowcase` - Component for highlighting features with icons and descriptions

## Troubleshooting

If your Builder.io content isn't appearing:

1. Check that you've published the content in Builder.io
2. Verify that the model names match exactly (`home-hero` and `home-features`)
3. Clear your browser cache and reload the page
4. Check the browser console for any errors related to Builder.io API calls

## API Key

The Builder.io API key is configured in `src/lib/builder.ts`. If you need to change it, update it there.

## Need Help?

For more information on using Builder.io, refer to the [Builder.io documentation](https://www.builder.io/c/docs/intro) or the main `BUILDER_INTEGRATION.md` file in this project.
