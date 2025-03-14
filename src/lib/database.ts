import { databases } from './appwrite';
import { ID, Query, Models } from 'appwrite';

export const DATABASE_ID = 'konipai_db';

export const Collections = {
  ORDERS: 'orders',
  ADDRESSES: 'addresses',
} as const;

export interface Order extends Models.Document {
  userId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    name: string;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface Address extends Models.Document {
  userId: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export const db = {
  // Orders
  async createOrder(order: Omit<Order, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId'>) {
    return databases.createDocument(
      DATABASE_ID,
      Collections.ORDERS,
      ID.unique(),
      order
    ) as Promise<Order>;
  },

  async getOrders(userId: string) {
    const response = await databases.listDocuments(
      DATABASE_ID,
      Collections.ORDERS,
      [Query.equal('userId', userId)]
    );
    return response.documents as Order[];
  },

  async getOrder(orderId: string) {
    return databases.getDocument(
      DATABASE_ID,
      Collections.ORDERS,
      orderId
    ) as Promise<Order>;
  },

  async updateOrderStatus(orderId: string, status: Order['status']) {
    return databases.updateDocument(
      DATABASE_ID,
      Collections.ORDERS,
      orderId,
      { status }
    ) as Promise<Order>;
  },

  // Addresses
  async createAddress(address: Omit<Address, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId'>) {
    return databases.createDocument(
      DATABASE_ID,
      Collections.ADDRESSES,
      ID.unique(),
      address
    ) as Promise<Address>;
  },

  async getAddresses(userId: string) {
    const response = await databases.listDocuments(
      DATABASE_ID,
      Collections.ADDRESSES,
      [Query.equal('userId', userId)]
    );
    return response.documents as Address[];
  },

  async updateAddress(addressId: string, address: Partial<Omit<Address, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId'>>) {
    return databases.updateDocument(
      DATABASE_ID,
      Collections.ADDRESSES,
      addressId,
      address
    ) as Promise<Address>;
  },

  async deleteAddress(addressId: string) {
    return databases.deleteDocument(
      DATABASE_ID,
      Collections.ADDRESSES,
      addressId
    );
  },

  async setDefaultAddress(userId: string, addressId: string) {
    // First, remove default from all addresses
    const addresses = await this.getAddresses(userId);
    await Promise.all(
      addresses
        .filter(addr => addr.isDefault && addr.$id !== addressId)
        .map(addr => this.updateAddress(addr.$id, { isDefault: false }))
    );

    // Set the new default address
    return this.updateAddress(addressId, { isDefault: true });
  }
}; 