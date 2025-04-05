# Slash Price Feature Guide for Konipai

This guide explains how to use the "slash price" or "strikethrough price" feature for your products in Konipai.

## What is a Slash Price?

A slash price (also known as strikethrough pricing) is a pricing strategy that shows:
1. The original price (crossed out)
2. The current discounted price
3. The percentage discount

This creates a sense of value for customers by showing them how much they're saving.

## Setting Up in PocketBase

### Add the Required Field

1. Login to your PocketBase admin panel (https://backend-pocketbase.7za6uc.easypanel.host/_/)
2. Navigate to the Collections section
3. Select the "products" collection
4. Click "Add field" and create a new field with these settings:
   - Name: `original_price`
   - Type: `Number`
   - Required: No (to make it optional for products that aren't discounted)
   - Min: 0 (to prevent negative prices)
   - Precision: 2 (for cents/paise)
5. Save the new field

### How to Use

When creating or editing a product:

1. Set the `price` field to the **current selling price**
2. Set the `original_price` field to the **regular price** (before discount)

For example:
- If a product normally sells for ₹1000 but is currently discounted to ₹800:
  - Set `price` to 800
  - Set `original_price` to 1000

The website will automatically:
- Display both prices
- Calculate and show the percentage discount
- Format the display with the original price crossed out

### Tips for Effective Use

1. **Meaningful Discounts**: Aim for discounts that feel significant (10% or more).
2. **Limited Time Offers**: Consider using slash pricing for limited-time promotions.
3. **Don't Overuse**: Using slash pricing on too many products can reduce its effectiveness.
4. **Be Honest**: The original price should be a genuine previous price, not an inflated figure.

## Implementation Details

The slash price feature has been implemented in:
- Product cards (on shop and category pages)
- Product detail pages
- Cross-selling recommendations in the cart

The discount percentage is automatically calculated using:
```javascript
Math.round((1 - discountedPrice / originalPrice) * 100)
```

## Support

If you encounter any issues with the slash price feature, please contact the development team. 