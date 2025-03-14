import { ID } from 'appwrite';
import { databases, DATABASE_ID, ORDERS_COLLECTION_ID } from './appwrite';

export type Order = {
  $id?: string;
  userId: string;
  products: Array<{
    productId: string;
    quantity: number;
    price: number;
    color?: string;
  }>;
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
};

export async function createOrder(order: Omit<Order, '$id'>): Promise<Order | null> {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      ID.unique(),
      order
    );
    return response as unknown as Order;
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.orderDesc('$createdAt')
      ]
    );
    return response.documents as unknown as Order[];
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<Order | null> {
  try {
    const response = await databases.updateDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      orderId,
      { status, updatedAt: new Date().toISOString() }
    );
    return response as unknown as Order;
  } catch (error) {
    console.error('Error updating order status:', error);
    return null;
  }
}