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
    phone?: string;
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
    specifications: {
        material: string;
        dimensions: string;
        weight: string;
        capacity: string;
        style: string;
        pattern: string;
        closure: string;
        waterResistant: boolean;
    };
    care_instructions: {
        cleaning: string[];
        storage: string[];
    };
    usage_guidelines: {
        recommended_use: string[];
        pro_tips: string[];
    };
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
    phone?: string;
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

export async function signInWithGoogle() {
    try {
        // Get the OAuth2 URL for Google
        const authData = await pb.collection('users').authWithOAuth2({ 
            provider: 'google',
            // Use simpler configuration with fewer options to avoid issues
            createData: {
                emailVisibility: true
            }
        });

        console.log('Google auth successful:', authData);
        return authData;
    } catch (error: any) {
        console.error('Google sign-in error:', error);
        
        // More specific error message for the user
        if (error?.status === 400 || (error?.response?.data?.code === 400)) {
            throw new Error('Authentication failed. Please check your Google account settings and try again.');
        } else if (error?.message?.includes('popup_closed')) {
            throw new Error('The sign-in window was closed. Please try again.');
        }
        
        throw error;
    }
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

// Product functions
export async function getProducts(filter?: ProductFilter, signal?: AbortSignal): Promise<Product[]> {
    try {
        const filterRules: string[] = [];
        
        if (filter) {
            if (filter.category) {
                filterRules.push(`category = "${filter.category}"`);
            }
            if (filter.bestseller !== undefined) {
                filterRules.push(`bestseller = ${filter.bestseller}`);
            }
            if (filter.new !== undefined) {
                filterRules.push(`new = ${filter.new}`);
            }
            if (filter.inStock !== undefined) {
                filterRules.push(`inStock = ${filter.inStock}`);
            }
        }

        const filterString = filterRules.length > 0 ? filterRules.join(' && ') : '';
        
        const options: ListOptions = {
            $autoCancel: false,
            requestKey: `products_${Date.now()}` // Add unique request key to prevent cancellation
        };

        if (signal) {
            options.signal = signal;
        }

        if (filterString) {
            options.filter = filterString;
        }

        console.log('Fetching products with options:', options);
        const records = await pb.collection(Collections.PRODUCTS).getList(1, 100, options);
        console.log(`Successfully fetched ${records.items.length} products`);

        // Process products even if reviews fail
        let processedProducts = records.items.map(record => ({
            ...record,
            $id: record.id,
            images: Array.isArray(record.images) 
                ? record.images.map((image: string) => `${record.id}/${image}`)
                : [],
            colors: typeof record.colors === 'string' ? JSON.parse(record.colors) : record.colors,
            features: typeof record.features === 'string' ? JSON.parse(record.features) : record.features,
            care: typeof record.care === 'string' ? JSON.parse(record.care) : record.care,
            tags: typeof record.tags === 'string' ? JSON.parse(record.tags) : record.tags,
            createdAt: record.created,
            updatedAt: record.updated,
            reviews: 0 // Default to 0 reviews initially
        })) as unknown as Product[];

        // Try to get review counts, but don't block product display if this fails
        try {
            const reviewCounts = await Promise.all(
                records.items.map(record => 
                    pb.collection('reviews').getList(1, 1, {
                        filter: `product = "${record.id}"`,
                        fields: 'id',
                        $autoCancel: false,
                        requestKey: `reviews_count_${record.id}_${Date.now()}`
                    })
                )
            );
            
            // Update products with review counts
            processedProducts = processedProducts.map((product, index) => ({
                ...product,
                reviews: reviewCounts[index].totalItems
            }));
        } catch (reviewError) {
            console.warn('Failed to fetch review counts:', reviewError);
            // Continue with products that have default review count of 0
        }

        return processedProducts;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw error;
        }
        console.error('Error fetching products:', error);
        // Return empty array instead of throwing to prevent UI from breaking
        return [];
    }
}

export async function getProduct(id: string) {
    console.log(`[PROD DEBUG] getProduct called for product ${id}`);
    console.log(`[PROD DEBUG] PocketBase URL: ${pocketbase.baseUrl}`);
    
    try {
        const startTime = Date.now();
        const options = {
            $autoCancel: false,
            requestKey: `prod_getProduct_${id}_${Date.now()}` // Unique key to prevent request cancellation
        };
        
        // Get the product
        console.log(`[PROD DEBUG] Fetching product data for ${id}`);
        const record = await pocketbase.collection('products').getOne<Product>(id, options);
        
        // Get the review count with auto-cancel disabled
        console.log(`[PROD DEBUG] Fetching review count for ${id}`);
        const reviewCount = await pocketbase.collection('reviews').getList(1, 1, {
            filter: `product = "${id}"`,
            fields: 'id',
            $autoCancel: false,
            requestKey: `prod_reviewCount_${id}_${Date.now()}`
        });
        
        const endTime = Date.now();
        console.log(`[PROD DEBUG] getProduct completed in ${endTime - startTime}ms`);
        
        return {
            ...record,
            $id: record.id,
            images: record.images.map(image => `${record.id}/${image}`),
            colors: typeof record.colors === 'string' ? JSON.parse(record.colors) : record.colors,
            features: typeof record.features === 'string' ? JSON.parse(record.features) : record.features,
            care: typeof record.care === 'string' ? JSON.parse(record.care) : record.care,
            tags: typeof record.tags === 'string' ? JSON.parse(record.tags) : record.tags,
            reviews: reviewCount.totalItems // Set the actual review count
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[PROD DEBUG] Error fetching product ${id}:`, errorMessage);
        throw error; // Re-throw to allow proper error handling in UI
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

// Slider images functions
export async function getSliderImages(signal?: AbortSignal): Promise<SliderImage[]> {
    try {
        const options: ListOptions = {
            filter: 'active = true',
            sort: '+order',
            $autoCancel: false
        };

        if (signal) {
            options.signal = signal;
        }

        const records = await pb.collection(Collections.SLIDER_IMAGES).getList(1, 10, options);

        return records.items.map(record => ({
            ...record,
            image: pb.files.getUrl(record, record.image)
        })) as SliderImage[];
    } catch (error) {
        if (error.name === 'AbortError') {
            throw error;
        }
        console.error('Error fetching slider images:', error);
        return [];
    }
}

export interface Review {
    id: string;
    user: string;
    product: string;
    rating: number;
    title: string;
    content: string;
    images: string[];
    verified_purchase: boolean;
    helpful_votes: number;
    created: string;
    updated: string;
    expand?: {
        user: User;
        comments: ReviewComment[];
    };
}

export interface ReviewComment {
    id: string;
    review: string;
    user: string;
    content: string;
    created: string;
    updated: string;
    expand?: {
        user: User;
    };
}

// Function to create a review
export const createReview = async (
    productId: string,
    rating: number,
    title: string,
    content: string,
    images: File[],
    verifiedPurchase: boolean = false
): Promise<Review> => {
    const formData = new FormData();
    formData.append('user', pocketbase.authStore.model?.id || '');
    formData.append('product', productId);
    formData.append('rating', rating.toString());
    formData.append('title', title);
    formData.append('content', content);
    formData.append('verified_purchase', verifiedPurchase.toString());
    formData.append('helpful_votes', '0');
    
    images.forEach(image => {
        formData.append('images', image);
    });

    // Create the review
    const review = await pocketbase.collection('reviews').create(formData);

    // Update the product's review count
    const product = await pocketbase.collection('products').getOne(productId);
    await pocketbase.collection('products').update(productId, {
        reviews: (product.reviews || 0) + 1
    });

    return review;
};

// Function to get reviews for a product
export async function getProductReviews(productId: string): Promise<Review[]> {
  console.log(`[PROD DEBUG] getProductReviews called for product ${productId}`);
  console.log(`[PROD DEBUG] PocketBase URL: ${pocketbase.baseUrl}`);
  
  try {
    const startTime = Date.now();
    const options = {
      filter: `product = "${productId}"`,
      sort: '-created',
      expand: 'user,comments.user',
      $autoCancel: false,
      requestKey: `prod_reviews_${productId}_${Date.now()}` // Unique key to prevent request cancellation
    };
    
    const result = await pocketbase.collection('reviews').getFullList(options);
    
    const endTime = Date.now();
    console.log(`[PROD DEBUG] Reviews request completed in ${endTime - startTime}ms, found ${result.length} reviews`);
    
    return result as unknown as Review[];
  } catch (error) {
    // Handle error safely
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[PROD DEBUG] Error fetching reviews for product ${productId}:`, errorMessage);
    return []; // Return empty array instead of throwing to prevent product display failure
  }
}

// Function to add a comment to a review
export const addReviewComment = async (reviewId: string, content: string): Promise<ReviewComment> => {
    return await pocketbase.collection('review_comments').create({
        review: reviewId,
        user: pocketbase.authStore.model?.id,
        content
    });
};

// Function to vote on a review
export const voteReview = async (reviewId: string): Promise<Review> => {
    const review = await pocketbase.collection('reviews').getOne(reviewId);
    return await pocketbase.collection('reviews').update(reviewId, {
        helpful_votes: (review.helpful_votes || 0) + 1
    });
}; 