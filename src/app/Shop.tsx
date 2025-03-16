                      {/* Product name and price */}
                      <div>
                        <h3 className="font-medium text-base mb-1 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <p className="text-base font-medium">
                            ₹{typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                          </p>
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div> 