import PocketBase, { RecordModel } from 'pocketbase';

console.log('Initializing PocketBase client with URL:', import.meta.env.VITE_POCKETBASE_URL);

// Initialize PocketBase client with proper fallback URL
const pb = new PocketBase(
    import.meta.env.VITE_POCKETBASE_URL || 'https://backend-pocketbase.7za6uc.easypanel.host'
);

// Export the client instance
export const pocketbase = pb;

// Export collection names as constants
export enum Collections {
    PRODUCTS = 'products',
    USERS = 'users',
    ORDERS = 'orders',
    ADDRESSES = 'addresses',
    CARTS = 'carts',
    ASSETS = 'assets',
    SLIDER_IMAGES = 'slider_images'
}

// Type definitions for PocketBase records
export interface ProductRecord {
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    colors: Array<{
        name: string;
        value: string;
        hex: string;
    }>;
    features: string[];
    dimensions: string;
    material: string;
    care: string[];
    category: string;
    tags: string[];
    bestseller: boolean;
    new: boolean;
    inStock: boolean;
    reviews?: number;
    created: string;
    updated: string;
}

export interface UserRecord {
    id: string;
    email: string;
    name: string;
    phone?: string;
    address?: string;
    created: string;
    updated: string;
}

export interface OrderRecord {
    id: string;
    user: string; // References users.id
    products: Array<{
        productId: string;
        quantity: number;
        price: number;
    }>;
    totalAmount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    shippingAddress: string;
    created: string;
    updated: string;
}

export interface AddressRecord {
    id: string;
    user: string; // References users.id
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
    created: string;
    updated: string;
}

export interface User extends RecordModel {
    email: string;
    name: string;
    avatar?: string;
}

export interface Product extends RecordModel {
    $id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    colors: ProductColor[];
    features: string[];
    dimensions: string;
    material: string;
    care: string[];
    category: string;
    tags: string[];
    bestseller: boolean;
    new: boolean;
    inStock: boolean;
    reviews?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProductColor {
    name: string;
    value: string;
    hex: string;
}

export interface Address extends RecordModel {
    user: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
}

export interface Order extends RecordModel {
    user: string;
    products: CartProduct[];
    totalAmount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    shippingAddress: string;
}

export interface CartProduct {
    id: string;
    quantity: number;
    color: string;
}

export interface ProductFilter {
    category?: string;
    bestseller?: boolean;
    new?: boolean;
    inStock?: boolean;
}

export interface CartRecord {
    id: string;
    user: string; // References users.id
    items: string; // JSON string of CartItem[]
    created: string;
    updated: string;
}

export interface Cart extends RecordModel {
    user: string;
    items: CartItem[];
}

export interface CartItem {
    productId: string;
    product: Product;
    quantity: number;
    color: string;
}

interface ListOptions {
    filter?: string;
    signal?: AbortSignal;
    $autoCancel?: boolean;
    sort?: string;
}

// Auth functions
export async function signIn(email: string, password: string) {
    const authData = await pb.collection('users').authWithPassword(email, password);
    return authData;
}

export async function signUp(email: string, password: string, name: string) {
    const user = await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        name,
    });
    return user;
}

export async function signOut() {
    pb.authStore.clear();
}

// Add a type definition for ProductFilterOptions
interface ProductFilterOptions {
  category?: string;
  bestseller?: boolean;
  new?: boolean;
  inStock?: boolean;
}

// Add a simple in-memory cache for products
const cache = {
  products: new Map<string, { data: Product[], timestamp: number }>(),
  sliderImages: new Map<string, { data: SliderImage[], timestamp: number }>(),
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
  
  // Helper to generate cache keys
  getCacheKey(options?: ProductFilterOptions): string {
    if (!options) return 'all';
    return JSON.stringify(options);
  },
  
  // Check if cache is valid
  isValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }
};

// Modify getProducts to use cache
export async function getProducts(
  options?: ProductFilterOptions,
  signal?: AbortSignal
): Promise<Product[]> {
  try {
    const cacheKey = cache.getCacheKey(options);
    const cachedData = cache.products.get(cacheKey);
    
    // Return cached data if it's valid
    if (cachedData && cache.isValid(cachedData.timestamp)) {
      console.log('Using cached products data for:', cacheKey);
      return cachedData.data;
    }
    
    // If no valid cache, fetch fresh data
    const filterRules: string[] = [];
    
    if (options) {
      if (options.category) {
        filterRules.push(`category = "${options.category}"`);
      }
      
      if (typeof options.bestseller === 'boolean') {
        filterRules.push(`bestseller = ${options.bestseller}`);
      }
      
      if (typeof options.new === 'boolean') {
        filterRules.push(`new = ${options.new}`);
      }
      
      if (typeof options.inStock === 'boolean') {
        filterRules.push(`inStock = ${options.inStock}`);
      }
    }
    
    const filter = filterRules.length > 0 ? filterRules.join(' && ') : '';
    
    const fetchOptions: ListOptions = {
      filter,
      sort: '-created',
      $autoCancel: false
    };
    
    if (signal) {
      fetchOptions.signal = signal;
    }
    
    console.log('Fetching products with options:', fetchOptions);
    
    const response = await pb.collection(Collections.PRODUCTS).getList(1, 100, fetchOptions);
    console.log('Products API response:', response);
    
    const products = response.items.map(record => {
      // Ensure proper mapping of record fields to Product interface
      return {
        id: record.id,
        $id: record.id,
        name: record.name,
        description: record.description,
        price: record.price,
        images: record.images && record.images.length > 0
          ? record.images.map((image: string) => `${record.id}/${image}`)
          : [],
        colors: typeof record.colors === 'string' ? JSON.parse(record.colors) : record.colors,
        features: typeof record.features === 'string' ? JSON.parse(record.features) : record.features,
        care: typeof record.care === 'string' ? JSON.parse(record.care) : record.care,
        tags: typeof record.tags === 'string' ? JSON.parse(record.tags) : record.tags,
        category: record.category,
        dimensions: record.dimensions,
        material: record.material,
        bestseller: record.bestseller,
        new: record.new,
        inStock: record.inStock,
        reviews: record.reviews,
        createdAt: record.created,
        updatedAt: record.updated
      } as unknown as Product;
    });
    
    // Cache the results
    cache.products.set(cacheKey, { 
      data: products, 
      timestamp: Date.now() 
    });
    
    return products;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Error fetching products:', error);
    return [];
  }
}

// Modify getProduct to use cache when possible
export async function getProduct(id: string): Promise<Product | null> {
  try {
    // Check if we have this product in any cache entry
    for (const [_, cachedData] of cache.products.entries()) {
      if (cache.isValid(cachedData.timestamp)) {
        const product = cachedData.data.find(p => p.id === id);
        if (product) {
          console.log('Found product in cache:', id);
          return product;
        }
      }
    }
    
    // No cache hit, fetch the product
    console.log('Fetching product from API:', id);
    const record = await pb.collection(Collections.PRODUCTS).getOne(id);
    console.log('Product API response:', record);
    
    // Ensure proper mapping of record fields to Product interface
    const product = {
      id: record.id,
      $id: record.id,
      name: record.name,
      description: record.description,
      price: record.price,
      images: record.images && record.images.length > 0
        ? record.images.map(image => `${record.id}/${image}`)
        : [],
      colors: typeof record.colors === 'string' ? JSON.parse(record.colors) : record.colors,
      features: typeof record.features === 'string' ? JSON.parse(record.features) : record.features,
      care: typeof record.care === 'string' ? JSON.parse(record.care) : record.care,
      tags: typeof record.tags === 'string' ? JSON.parse(record.tags) : record.tags,
      category: record.category,
      dimensions: record.dimensions,
      material: record.material,
      bestseller: record.bestseller,
      new: record.new,
      inStock: record.inStock,
      reviews: record.reviews,
      createdAt: record.created,
      updatedAt: record.updated
    } as unknown as Product;
    
    // Add to cache (using a specific key for this product)
    const cacheKey = `product_${id}`;
    cache.products.set(cacheKey, { 
      data: [product], 
      timestamp: Date.now() 
    });
    
    return product;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
}

// Address functions
export async function getAddresses() {
    if (!pb.authStore.model?.id) return [];
    return await pb.collection('addresses').getFullList<Address>({
        filter: `user = "${pb.authStore.model.id}"`,
    });
}

export async function createAddress(address: Omit<Address, keyof RecordModel>) {
    if (!pb.authStore.model?.id) throw new Error('Not authenticated');
    return await pb.collection('addresses').create({
        ...address,
        user: pb.authStore.model.id,
    });
}

export async function updateAddress(id: string, address: Partial<Omit<Address, keyof RecordModel>>) {
    return await pb.collection('addresses').update(id, address);
}

export async function deleteAddress(id: string) {
    return await pb.collection('addresses').delete(id);
}

// Order functions
export async function getOrders() {
    if (!pb.authStore.model?.id) return [];
    return await pb.collection('orders').getFullList<Order>({
        filter: `user = "${pb.authStore.model.id}"`,
        expand: 'shippingAddress',
    });
}

export async function createOrder(order: Omit<Order, keyof RecordModel>) {
    if (!pb.authStore.model?.id) throw new Error('Not authenticated');
    return await pb.collection('orders').create({
        ...order,
        user: pb.authStore.model.id,
    });
}

// Profile functions
export async function updateProfile(data: Partial<Omit<User, keyof RecordModel>>) {
    if (!pb.authStore.model?.id) throw new Error('Not authenticated');
    return await pb.collection('users').update(pb.authStore.model.id, data);
}

export async function uploadAvatar(file: File) {
    if (!pb.authStore.model?.id) throw new Error('Not authenticated');
    const formData = new FormData();
    formData.append('avatar', file);
    return await pb.collection('users').update(pb.authStore.model.id, formData);
}

// Auth state
export function isAuthenticated() {
    return pb.authStore.isValid;
}

export function getCurrentUser(): User | null {
    const model = pb.authStore.model;
    return model ? model as User : null;
}

// Subscribe to auth changes
export function onAuthStateChange(callback: (isAuthenticated: boolean) => void) {
    console.log('Setting up auth state change listener');
    
    // Immediately trigger callback with current state to ensure proper initialization
    const initialState = pb.authStore.isValid;
    console.log('Initial auth state:', initialState ? 'authenticated' : 'not authenticated');
    
    // Execute callback once on setup with the current state
    setTimeout(() => {
        callback(initialState);
    }, 0);
    
    // Set up the listener for future changes
    pb.authStore.onChange((token, model) => {
        const isAuth = !!token && !!model;
        console.log('Auth state changed:', isAuth ? 'authenticated' : 'not authenticated');
        callback(isAuth);
    });
}

export interface SliderImage extends RecordModel {
    image: string;
    alt: string;
    order: number;
    active: boolean;
    link: string;
    title: string;
    description: string;
}

// Modify getSliderImages to use cache
export async function getSliderImages(signal?: AbortSignal): Promise<SliderImage[]> {
  try {
    const cacheKey = 'sliderImages';
    const cachedData = cache.sliderImages.get(cacheKey);
    
    // Return cached data if it's valid
    if (cachedData && cache.isValid(cachedData.timestamp)) {
      console.log('Using cached slider images');
      return cachedData.data;
    }
    
    const options: ListOptions = {
      filter: 'active = true',
      sort: '+order',
      $autoCancel: false
    };

    if (signal) {
      options.signal = signal;
    }

    const records = await pb.collection(Collections.SLIDER_IMAGES).getList(1, 10, options);

    const sliderImages = records.items.map(record => ({
      ...record,
      image: pb.files.getUrl(record, record.image)
    })) as SliderImage[];
    
    // Cache the results
    cache.sliderImages.set(cacheKey, { 
      data: sliderImages, 
      timestamp: Date.now() 
    });

    return sliderImages;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Error fetching slider images:', error);
    return [];
  }
} 