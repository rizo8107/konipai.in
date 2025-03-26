# Facebook Conversions API Integration

This document explains how to use the Facebook Conversions API (CAPI) integration in the Konipai application.

## Overview

The Facebook Conversions API allows server-side tracking of conversion events, providing more accurate data than client-side tracking alone. Our implementation includes:

- Server-side event tracking
- Automatic PII hashing
- Integration with existing analytics
- Support for standard Facebook events

## Configuration

1. Set your Facebook Pixel ID in `src/lib/capi.ts`:
```typescript
const PIXEL_ID = 'your-pixel-id-here';
```

2. The access token is already configured in the code. If you need to update it:
```typescript
const ACCESS_TOKEN = 'your-access-token-here';
```

## Supported Events

The integration supports these standard Facebook events:

- Purchase
- AddToCart
- Lead
- Custom events (via `sendConversionEvent`)

## Usage Examples

### Track a Purchase

```typescript
import { trackPurchase } from '@/lib/analytics';

await trackPurchase(
  products,
  orderId,
  totalValue,
  shippingCost,
  taxAmount,
  couponCode,
  'Konipai Web Store',
  {
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    city: user.city,
    state: user.state,
    zipCode: user.zipCode,
    country: user.country,
    externalId: user.id
  }
);
```

### Track Add to Cart

```typescript
import { trackAddToCart } from '@/lib/analytics';

await trackAddToCart(
  product,
  {
    email: user.email,
    externalId: user.id
  }
);
```

### Track a Lead

```typescript
import { trackFormCompletion } from '@/lib/analytics';

await trackFormCompletion(
  'Newsletter Signup',
  'newsletter-form',
  {
    email: formData.email
  }
);
```

### Send Custom Event

```typescript
import { sendConversionEvent } from '@/lib/capi';

await sendConversionEvent(
  'CustomEvent',
  {
    email: user.email,
    externalId: user.id
  },
  {
    value: 123.45,
    currency: 'INR',
    content_name: 'Custom Action'
  }
);
```

## Data Privacy

- All PII (Personally Identifiable Information) is automatically hashed using SHA-256 before being sent to Facebook
- User data is only sent when explicitly provided
- The integration follows Facebook's data privacy requirements

## Best Practices

1. Always include user data when available for better conversion tracking
2. Use appropriate event names from Facebook's standard event list
3. Include as much event-specific data as possible
4. Test events in Facebook's Event Testing Tool
5. Monitor your Events Manager for any data quality issues

## Debugging

Events are logged to the console:
- Success: "CAPI event sent successfully: [eventName]"
- Error: "Error sending CAPI event: [error]"

## Additional Resources

- [Facebook Conversions API Documentation](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Standard Events Reference](https://developers.facebook.com/docs/meta-pixel/reference)
- [Event Testing Tool](https://developers.facebook.com/docs/meta-pixel/testing-and-debugging) 