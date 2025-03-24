/// <reference path="../pb_data/types.d.ts" />

// Function to log directly to console
function directLog(...args) {
    const msg = args.map(arg => {
        if (typeof arg === 'object') {
            return JSON.stringify(arg);
        }
        return String(arg);
    }).join(' ');
    
    console.log(`[COUPON] ${msg}`);
}

// Validate and apply coupon to total
async function validateCoupon(couponCode, subtotal) {
    try {
        directLog(`Validating coupon ${couponCode} for subtotal ${subtotal}`);
        
        if (!couponCode || !subtotal) {
            return { valid: false, message: 'Invalid coupon code or subtotal' };
        }
        
        // Find the coupon in the database
        const coupon = await $app.dao().findFirstRecordByData('coupons', { code: couponCode });
        
        if (!coupon) {
            return { valid: false, message: 'Coupon not found' };
        }
        
        // Check if coupon is active
        if (!coupon.active) {
            return { valid: false, message: 'This coupon is not active' };
        }
        
        // Check expiration date
        if (coupon.expires_at) {
            const expiryDate = new Date(coupon.expires_at);
            const now = new Date();
            
            if (now > expiryDate) {
                return { valid: false, message: 'This coupon has expired' };
            }
        }
        
        // Check minimum order value
        if (coupon.min_order_value && subtotal < coupon.min_order_value) {
            return { 
                valid: false, 
                message: `This coupon requires a minimum order of ₹${coupon.min_order_value}` 
            };
        }
        
        // Check usage limit
        if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
            return { valid: false, message: 'This coupon has reached its usage limit' };
        }
        
        // Calculate discount amount
        let discountAmount = 0;
        
        if (coupon.type === 'percentage') {
            // Percentage discount (e.g., 10% off)
            discountAmount = (subtotal * coupon.amount) / 100;
        } else if (coupon.type === 'fixed_amount') {
            // Fixed amount discount (e.g., ₹100 off)
            discountAmount = Math.min(coupon.amount, subtotal); // Don't allow negative total
        }
        
        // Round to 2 decimal places
        discountAmount = Math.round(discountAmount * 100) / 100;
        
        return { 
            valid: true, 
            coupon: coupon,
            discountAmount: discountAmount,
            message: 'Coupon applied successfully!'
        };
        
    } catch (error) {
        directLog(`Error validating coupon: ${error.message}`);
        return { valid: false, message: 'Error validating coupon' };
    }
}

// Increment coupon usage
async function incrementCouponUsage(couponId) {
    try {
        if (!couponId) return false;
        
        const coupon = await $app.dao().findRecordById('coupons', couponId);
        if (!coupon) return false;
        
        coupon.current_uses = (coupon.current_uses || 0) + 1;
        await $app.dao().saveRecord(coupon);
        
        return true;
    } catch (error) {
        directLog(`Error incrementing coupon usage: ${error.message}`);
        return false;
    }
}

// Create route to validate coupon
$app.onRequest('POST', '/api/coupons/validate', async (e) => {
    e.bypassAuth = true; // Allow public access
    
    try {
        // Handle CORS preflight request
        if (e.method === 'OPTIONS') {
            return new Response('', {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Max-Age': '86400',
                }
            });
        }
        
        // Parse request body
        const body = JSON.parse(e.bodyString);
        const { code, subtotal } = body;
        
        if (!code || subtotal === undefined) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Missing required fields'
            }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
        // Validate the coupon
        const result = await validateCoupon(code, subtotal);
        
        return new Response(JSON.stringify({
            success: result.valid,
            message: result.message,
            data: result.valid ? {
                couponId: result.coupon.id,
                discountAmount: result.discountAmount,
                code: result.coupon.code,
                type: result.coupon.type,
                amount: result.coupon.amount
            } : null
        }), {
            status: result.valid ? 200 : 400,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        directLog(`Error in coupon validation endpoint: ${error.message}`);
        
        return new Response(JSON.stringify({
            success: false,
            message: 'Server error processing coupon'
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
});

// Export functions for use in other hooks
module.exports = {
    validateCoupon,
    incrementCouponUsage
};
