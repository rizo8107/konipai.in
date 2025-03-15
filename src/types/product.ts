import { RecordModel } from 'pocketbase';

export type ProductColor = {
  name: string;
  value: string;
  hex: string;
};

export type Product = RecordModel & {
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
};
