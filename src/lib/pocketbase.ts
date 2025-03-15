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
    ASSETS = 'assets'
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
            $autoCancel: false
        };

        if (signal) {
            options.signal = signal;
        }

        if (filterString) {
            options.filter = filterString;
        }

        const records = await pb.collection(Collections.PRODUCTS).getList(1, 50, options);

        return records.items.map(record => ({
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
            updatedAt: record.updated
        })) as unknown as Product[];
    } catch (error) {
        if (error.name === 'AbortError') {
            throw error;
        }
        console.error('Error fetching products:', error);
        return [];
    }
}

export async function getProduct(id: string) {
    const record = await pb.collection('products').getOne<Product>(id);
    return {
        ...record,
        $id: record.id,
        images: record.images.map(image => `${record.id}/${image}`),
        colors: typeof record.colors === 'string' ? JSON.parse(record.colors) : record.colors,
        features: typeof record.features === 'string' ? JSON.parse(record.features) : record.features,
        care: typeof record.care === 'string' ? JSON.parse(record.care) : record.care,
        tags: typeof record.tags === 'string' ? JSON.parse(record.tags) : record.tags,
    };
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
    pb.authStore.onChange((token, model) => {
        callback(!!token && !!model);
    });
} 