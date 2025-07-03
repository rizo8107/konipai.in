# Builder.io Integration for Konipai

This document explains how to use Builder.io with the Konipai e-commerce platform to visually edit and manage content.

## Setup

1. **Create a Builder.io Account**:
   - Sign up at [builder.io](https://builder.io)
   - Create a new space for your project
   - Get your API key from Account Settings > API Keys

2. **Configure API Key**:
   - Open `src/lib/builder.ts`
   - Replace `YOUR_API_KEY` with your actual Builder.io API key

## Available Components

The following Konipai components are registered with Builder.io and can be used in the visual editor:

- **Button**: Standard UI button with various styling options
- **ProductImage**: Component for displaying product images with different sizes and aspect ratios
- **VideoPlayer**: Video player component with controls and responsive design
- **Card**: Container component for organizing content

## How to Use

### Creating Pages with Builder.io

1. Log in to your Builder.io account
2. Create a new page in the "page" model
3. Set the URL to match your desired route (e.g., `/about-us`)
4. Design your page using the Builder.io editor
5. Publish the page when ready

### Accessing Builder.io Pages

Builder.io pages are available at:
- `/builder/*` - For regular pages
- `/builder-preview/*` - For previewing unpublished changes

### Editing Existing Pages

To make an existing page editable with Builder.io:

1. Create a new page in Builder.io with the same URL path as your React page
2. Replace the React component with the BuilderPage component
3. The Builder.io content will override your React component when available

## Component Registration

To register additional components with Builder.io:

1. Open `src/lib/builder-registry.tsx`
2. Add your component using the `Builder.registerComponent` method
3. Define the inputs that should be editable in the Builder.io interface

Example:
```tsx
Builder.registerComponent(YourComponent, {
  name: 'YourComponent',
  inputs: [
    { name: 'title', type: 'string', defaultValue: 'Default Title' },
    { name: 'description', type: 'text' },
    { name: 'showImage', type: 'boolean', defaultValue: true },
  ],
});
```

## Troubleshooting

- If content isn't showing up, check that the URL path in Builder.io exactly matches your route
- Ensure your API key is correctly set in `src/lib/builder.ts`
- Check browser console for any errors related to Builder.io API calls
- Verify that components are properly registered in `src/lib/builder-registry.tsx`
