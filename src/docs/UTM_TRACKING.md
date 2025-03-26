# UTM Parameter Tracking Documentation

This document explains how to implement and use UTM parameter tracking in the Konipai application.

## What are UTM Parameters?

UTM (Urchin Tracking Module) parameters are tags you add to URLs to track the effectiveness of your marketing campaigns in Google Analytics and other analytics tools. They include:

- **utm_source**: Identifies the source of your traffic (e.g., google, facebook, newsletter)
- **utm_medium**: Identifies the medium (e.g., cpc, email, social)
- **utm_campaign**: Identifies the specific campaign (e.g., spring_sale, product_launch)
- **utm_term**: Identifies paid search terms
- **utm_content**: Differentiates similar content or links within the same ad or page

## Implementation in Konipai

The UTM tracking system in Konipai has several components:

### 1. UTM Parameter Extraction and Storage

- Parameters are extracted from URLs and stored in localStorage with a 30-day expiry
- This allows attribution across multiple page views and visits

### 2. Automatic UTM Parameter Propagation

- UTM parameters are automatically added to internal links via the `UtmLink` component
- This ensures consistent tracking through the user journey

### 3. Google Analytics Integration

- UTM parameters are automatically added to all Google Analytics/GTM events
- This provides complete visibility into campaign performance

## How to Use

### Internal Links

Always use `UtmLink` instead of regular `Link` for internal navigation:

```tsx
import UtmLink from '@/components/UtmLink';

// Instead of <Link to="/shop">Shop</Link>
<UtmLink to="/shop">Shop</UtmLink>
```

### External Links

For external links where you want to preserve UTM context:

```tsx
import UtmExternalLink from '@/components/UtmExternalLink';

// This will add current UTM parameters to the external link
<UtmExternalLink 
  href="https://partner-site.com" 
  preserveUtm={true}
>
  Partner Site
</UtmExternalLink>
```

### Analytics

UTM parameters are automatically included in all analytics events. No additional code is needed.

## Testing UTM Tracking

1. Add UTM parameters to a URL (e.g., `https://konipai.in/?utm_source=newsletter&utm_medium=email&utm_campaign=summer_launch`)
2. Navigate through the site using internal links
3. Verify in browser console that UTM data is included in dataLayer events
4. Check Google Analytics to confirm the campaign data appears correctly

## Common UTM Parameter Formats

- **Source** (`utm_source`): google, facebook, instagram, newsletter, email, direct
- **Medium** (`utm_medium`): cpc, organic, email, social, referral, affiliate
- **Campaign** (`utm_campaign`): spring_sale, product_launch, weekly_newsletter, brand_awareness
- **Content** (`utm_content`): top_banner, sidebar, footer, image1, button2

## Notes and Limitations

- UTM parameters expire after 30 days
- The first-touch UTM parameters are prioritized (initial source of the customer)
- If a new set of UTM parameters is detected, it overwrites the previous values 