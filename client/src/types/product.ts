export interface Product {
  _id: string;
  name: string;
  thumbnail?: string;
  category: string | {
    _id: string;
    name: string;
  };
  providerId: string | {
    _id: string;
    fullName: string;
  };
  status: 'available' | 'unavailable';
  hasVariants: boolean;
  price?: number;
  inventory?: number;
  inventoryId: string;
  product_code?: string;
  detailsVariants?: Array<{
    variantDetails: Array<{
      variantId: string;
      value: string;
    }>;
    price: number;
    inventory: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
} 