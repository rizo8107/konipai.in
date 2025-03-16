                        <div className="flex justify-between py-1">
                          <span className="text-gray-600">{item.product.name} × {item.quantity}</span>
                          <span className="font-medium">₹{((item.product.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                        </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">{subtotal >= 100 ? 'Free' : `₹${shipping.toFixed(2)}`}</span>
                      </div>
                      <div className="flex justify-between py-1 font-semibold">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div> 