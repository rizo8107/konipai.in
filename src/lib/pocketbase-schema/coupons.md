# Coupons Collection Schema

This document describes the schema for the `coupons` collection in PocketBase, which is used to store coupon codes that can be displayed and auto-filled in the checkout page.

## Collection Name
`coupons`

## Fields

| Field Name | Type | Required | Unique | Min | Max | Options | Description |
|------------|------|----------|--------|-----|-----|---------|-------------|
| code | Text | Yes | Yes | - | 50 | - | The coupon code (e.g., "WELCOME10", "SUMMER25") |
| description | Text | No | No | - | 200 | - | Description of what the coupon offers |
| discount_type | Select | Yes | No | - | - | percentage, fixed | Whether the discount is a percentage or fixed amount |
| discount_value | Number | Yes | No | 0 | - | - | The discount value (percentage or fixed amount) |
| start_date | DateTime | Yes | No | - | - | - | When the coupon becomes valid |
| end_date | DateTime | Yes | No | - | - | - | When the coupon expires |
| active | Bool | Yes | No | - | - | - | Whether the coupon is currently active |
| display_on_checkout | Bool | Yes | No | - | - | - | Whether to show this coupon as a suggestion on the checkout page |
| display_priority | Number | No | No | 0 | 100 | - | Priority for display order (higher numbers shown first) |
| min_order_value | Number | No | No | 0 | - | - | Minimum order value required to use this coupon |
| max_uses | Number | No | No | 0 | - | - | Maximum number of times this coupon can be used (0 = unlimited) |
| current_uses | Number | No | No | 0 | - | - | How many times this coupon has been used |
| created | DateTime | System | - | - | - | - | When the record was created |
| updated | DateTime | System | - | - | - | - | When the record was last updated |

## Setup Instructions

1. Log in to your PocketBase Admin UI
2. Go to Collections and click "Create collection"
3. Enter "coupons" as the name
4. Add the fields as described in the table above
5. Set appropriate permissions:
   - Allow public read access (for fetching active coupons)
   - Restrict create/update/delete to admins only

## Example Record

```json
{
  "id": "abc123def456",
  "code": "WELCOME10",
  "description": "10% off your first order",
  "discount_type": "percentage",
  "discount_value": 10,
  "start_date": "2025-07-01 00:00:00.000Z",
  "end_date": "2025-12-31 23:59:59.000Z",
  "active": true,
  "display_on_checkout": true,
  "display_priority": 90,
  "min_order_value": 0,
  "max_uses": 0,
  "current_uses": 0,
  "created": "2025-06-30 12:34:56.789Z",
  "updated": "2025-06-30 12:34:56.789Z"
}
```

## Usage in Code

The coupon codes are fetched in the Checkout page component using the following filter:

```typescript
const coupons = await pocketbase.collection('coupons').getList(1, 5, {
  filter: `active = true && display_on_checkout = true && start_date <= "${now.toISOString()}" && end_date >= "${now.toISOString()}"`,
  sort: '-display_priority'
});
```

This query returns up to 5 active coupons that are set to display on checkout, sorted by display priority.
