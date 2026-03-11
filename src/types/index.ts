export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  description: string;
  features: string[];
  colors: Color[];
  dimensions: Dimensions;
  imageUrl: string;
  additionalImages: string[];
  inStock: boolean;
  isPublished: boolean;
  sortOrder: number;
  specifications: {
    material: string;
    finish: string;
    handleType: string;
    hingeType: string;
    mountingType: string;
    mirrorWidth?: number;
    mirrorHeight?: number;
    [key: string]: string | number | undefined;
  };
  createdAt?: string;
  updatedAt?: string;
}

export type ProductDetails = Product;

export interface Color {
  name: string;
  value: string;
}

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
  weight: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  imageUrl: string;
}

export interface NavLink {
  name: string;
  href: string;
}
