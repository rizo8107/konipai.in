# Facebook Pixel Integration

This document explains how Facebook Pixel is implemented across the Konipai website.

## Overview

Facebook Pixel is used to track user interactions on the website and measure the effectiveness of advertising campaigns. Our implementation includes:

- Client-side pixel integration with automatic page view tracking
- Server-side Conversions API (CAPI) for more reliable event tracking
- Integration with our existing analytics system
- Support for standard Facebook events

## Implementation

### Client-Side Pixel

The client-side Meta Pixel is implemented using:

1. `src/components/MetaPixel.tsx` - A React component that injects the Facebook Pixel script
2. `src/lib/pixel.ts` - Utility functions for tracking Pixel events

The Pixel is initialized with ID: `504160516081802`

### Server-Side Conversions API

The server-side Conversions API is implemented in:

1. `src/lib/capi.ts` - Utility functions for sending events through the Conversions API

## Tracked Events

The following standard events are automatically tracked:

| Event | Trigger |
|-------|---------|
| PageView | Every page load and route change |
| ViewContent | When viewing a product detail page |
| AddToCart | When adding a product to the cart |
| InitiateCheckout | When beginning the checkout process |
| Purchase | When completing a purchase |
| Lead | When submitting a form |

## Usage Examples

### Track a page view (automatic)

Page views are automatically tracked on every route change using the `MetaPixel` component.

### Track a custom event

```typescript
import { trackPixelCustomEvent } from '@/lib/pixel';

trackPixelCustomEvent('ProductFiltered', {
  filter_category: 'color',
  filter_value: 'blue'
});
```

### Track a standard event

```typescript
import { trackPixelEvent, pixelEvents } from '@/lib/pixel';

trackPixelEvent(pixelEvents.SEARCH, {
  search_string: 'eco-friendly bags'
});
```

### Track a purchase (through analytics)

```typescript
import { trackPurchase } from '@/lib/analytics';

trackPurchase(
  products,
  orderId,
  totalValue,
  shippingCost,
  taxAmount,
  couponCode,
  'Konipai Web Store',
  {
    email: user.email,
    phone: user.phone
    // other user data
  }
);
```

## Event Parameters

Each event can include various parameters:

### Common Parameters
- `value`: Monetary value 
- `currency`: Currency code (default is 'INR')
- `content_ids`: Array of product IDs
- `content_name`: Name of the content
- `content_category`: Category of the content

### Custom Parameters
You can add any custom parameters as needed:

```typescript
trackPixelEvent(pixelEvents.PURCHASE, {
  value: 100,
  currency: 'INR',
  custom_param1: 'value1',
  custom_param2: 'value2'
});
```

## Integration with GTM

Events are tracked both through Facebook Pixel and Google Tag Manager. The implementation ensures that:

1. Events are consistent between both systems
2. Event parameters follow both Facebook and Google Analytics 4 conventions
3. Server-side tracking via CAPI is used for critical conversion events 

## Testing

You can test Pixel events using:

1. Facebook Pixel Helper browser extension
2. Facebook Events Manager Test Events section
3. Looking at console logs (events are logged to console)

## Best Practices

1. Always include monetary values when applicable
2. Use standard event names when possible
3. Include as much event-specific data as possible
4. Monitor your Events Manager for any data quality issues

## Additional Resources

- [Facebook Pixel Documentation](https://developers.facebook.com/docs/meta-pixel)
- [Standard Events Reference](https://developers.facebook.com/docs/meta-pixel/reference)
- [Conversions API Documentation](https://developers.facebook.com/docs/marketing-api/conversions-api) 