# Special Offers Collection Schema

This document describes the schema for the `special_offers` collection in PocketBase, which is used to store dynamic special offers for the checkout page.

## Collection Name
`special_offers`

## Fields

| Field Name | Type | Required | Unique | Min | Max | Options | Description |
|------------|------|----------|--------|-----|-----|---------|-------------|
| title | Text | Yes | No | - | 100 | - | The title of the special offer (e.g., "Limited Time Offer", "Summer Sale") |
| description | Text | No | No | - | 500 | - | Optional description of the offer |
| discount_percentage | Number | Yes | No | 0 | 100 | - | The percentage discount to apply (e.g., 5 for 5%) |
| start_date | DateTime | Yes | No | - | - | - | When the offer starts |
| end_date | DateTime | Yes | No | - | - | - | When the offer expires |
| active | Bool | Yes | No | - | - | - | Whether the offer is currently active |
| min_order_value | Number | No | No | 0 | - | - | Optional minimum order value required for the offer to apply |
| max_discount_amount | Number | No | No | 0 | - | - | Optional maximum discount amount in currency units |
| created | DateTime | System | - | - | - | - | When the record was created |
| updated | DateTime | System | - | - | - | - | When the record was last updated |

## Setup Instructions

1. Log in to your PocketBase Admin UI
2. Go to Collections and click "Create collection"
3. Enter "special_offers" as the name
4. Add the fields as described in the table above
5. Set appropriate permissions:
   - Allow public read access (for fetching active offers)
   - Restrict create/update/delete to admins only

## Example Record

```json
{
  "id": "abc123def456",
  "title": "Limited Time Offer",
  "description": "Complete your purchase in the next 15 minutes to save!",
  "discount_percentage": 5,
  "start_date": "2025-07-01 00:00:00.000Z",
  "end_date": "2025-08-01 00:00:00.000Z",
  "active": true,
  "min_order_value": 0,
  "max_discount_amount": 500,
  "created": "2025-06-30 12:34:56.789Z",
  "updated": "2025-06-30 12:34:56.789Z"
}
```

## Usage in Code

The special offers are fetched in the Checkout page component using the following filter:

```typescript
const offers = await pocketbase.collection('special_offers').getList(1, 1, {
  filter: `active = true && start_date <= "${now.toISOString()}" && end_date >= "${now.toISOString()}"`,
  sort: '-created'
});
```

This query returns the most recently created active offer that is currently valid based on its date range.
