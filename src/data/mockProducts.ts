import type { ClothingCategory } from '../types';

export interface Product {
  id: string;
  name: string;
  price: number;
  shop: string;
  imageColor: string;
  category: ClothingCategory[];
  sizeMatch: 'perfect' | 'good';
  sponsored: boolean;
  url: string;
}

export const mockProducts: Product[] = [
  {
    id: '1',
    name: '오버핏 코튼 크루넥 티셔츠',
    price: 29900,
    shop: '무신사',
    imageColor: '#6366f1',
    category: ['tshirt'],
    sizeMatch: 'perfect',
    sponsored: true,
    url: '#',
  },
  {
    id: '2',
    name: '레귤러핏 옥스포드 셔츠',
    price: 35000,
    shop: '29CM',
    imageColor: '#10b981',
    category: ['tshirt'],
    sizeMatch: 'good',
    sponsored: false,
    url: '#',
  },
];
