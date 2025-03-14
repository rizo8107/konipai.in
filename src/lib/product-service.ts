import { ID, Query, Models } from 'appwrite';
import { databases, DATABASE_ID, PRODUCTS_COLLECTION_ID } from './appwrite';
import { Product, ProductColor } from '../types/product';

type DatabaseProduct = Models.Document & {
  name: string;
  description: string;
  price: number;
  images: string | string[];
  colors: string | ProductColor[];
  features: string | string[];
  dimensions: string;
  material: string;
  care: string | string[];
  category: string;
  tags: string | string[];
  bestseller: boolean;
  new: boolean;
  inStock: boolean;
};

// Helper function to transform database product to application product
function transformDatabaseProduct(dbProduct: DatabaseProduct): Product {
  return {
    $id: dbProduct.$id,
    name: dbProduct.name,
    description: dbProduct.description,
    price: dbProduct.price,
    images: Array.isArray(dbProduct.images) ? dbProduct.images : [dbProduct.images],
    colors: typeof dbProduct.colors === 'string' 
      ? JSON.parse(dbProduct.colors) 
      : (Array.isArray(dbProduct.colors) ? dbProduct.colors : []),
    features: Array.isArray(dbProduct.features) ? dbProduct.features : [dbProduct.features],
    dimensions: dbProduct.dimensions,
    material: dbProduct.material,
    care: Array.isArray(dbProduct.care) ? dbProduct.care : [dbProduct.care],
    category: dbProduct.category,
    tags: Array.isArray(dbProduct.tags) ? dbProduct.tags : dbProduct.tags.toString().split(','),
    bestseller: dbProduct.bestseller,
    new: dbProduct.new,
    inStock: dbProduct.inStock,
    createdAt: dbProduct.$createdAt,
    updatedAt: dbProduct.$updatedAt
  };
}

type CreateProductData = Omit<Product, '$id' | 'createdAt' | 'updatedAt'>;
type UpdateProductData = Partial<CreateProductData>;

// Helper function to transform application product to database format
function transformProductForDatabase(product: CreateProductData | UpdateProductData): Partial<DatabaseProduct> {
  const transformed: Partial<DatabaseProduct> = {
    ...product,
    colors: product.colors ? JSON.stringify(product.colors) : undefined,
  };

  if (product.images) {
    transformed.images = Array.isArray(product.images) ? product.images : [product.images];
  }
  if (product.features) {
    transformed.features = Array.isArray(product.features) ? product.features : [product.features];
  }
  if (product.care) {
    transformed.care = Array.isArray(product.care) ? product.care : [product.care];
  }
  if (product.tags) {
    transformed.tags = Array.isArray(product.tags) 
      ? product.tags 
      : (typeof product.tags === 'string' ? [product.tags] : []);
  }

  return transformed;
}

export async function getProducts(): Promise<Product[]> {
  try {
    const response = await databases.listDocuments<DatabaseProduct>(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [
        Query.limit(100)
      ]
    );
    return response.documents.map(transformDatabaseProduct);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const response = await databases.getDocument<DatabaseProduct>(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      id
    );
    return transformDatabaseProduct(response);
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Admin-only functions - these should only be used in admin scripts or protected routes
export async function createProduct(product: CreateProductData): Promise<Product | null> {
  try {
    const dbProduct = transformProductForDatabase(product);
    const response = await databases.createDocument<DatabaseProduct>(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      ID.unique(),
      dbProduct
    );
    return transformDatabaseProduct(response);
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
}

export async function updateProduct(id: string, product: UpdateProductData): Promise<Product | null> {
  try {
    const dbProduct = transformProductForDatabase(product);
    const response = await databases.updateDocument<DatabaseProduct>(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      id,
      dbProduct
    );
    return transformDatabaseProduct(response);
  } catch (error) {
    console.error('Error updating product:', error);
    return null;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      id
    );
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const response = await databases.listDocuments<DatabaseProduct>(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [
        Query.search('name', query),
        Query.limit(10)
      ]
    );
    return response.documents.map(transformDatabaseProduct);
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

export async function getBestsellers(): Promise<Product[]> {
  try {
    const response = await databases.listDocuments<DatabaseProduct>(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [
        Query.equal('bestseller', true),
        Query.equal('inStock', true),
        Query.limit(8)
      ]
    );
    return response.documents.map(transformDatabaseProduct);
  } catch (error) {
    console.error('Error fetching bestsellers:', error);
    return [];
  }
}

export async function getNewArrivals(): Promise<Product[]> {
  try {
    const response = await databases.listDocuments<DatabaseProduct>(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [
        Query.equal('new', true),
        Query.equal('inStock', true),
        Query.limit(8)
      ]
    );
    return response.documents.map(transformDatabaseProduct);
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    return [];
  }
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    const response = await databases.listDocuments<DatabaseProduct>(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [
        Query.equal('category', category),
        Query.equal('inStock', true),
        Query.limit(12)
      ]
    );
    return response.documents.map(transformDatabaseProduct);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
}