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
    category: ['tshirt', 'long_sleeve'],
    sizeMatch: 'perfect',
    sponsored: true,
    url: '#',
  },
  {
    id: '2',
    name: '슬림핏 스트레치 데님 팬츠',
    price: 49900,
    shop: '지그재그',
    imageColor: '#2563eb',
    category: ['pants'],
    sizeMatch: 'perfect',
    sponsored: false,
    url: '#',
  },
  {
    id: '3',
    name: '린넨 블렌드 A라인 원피스',
    price: 65000,
    shop: 'W컨셉',
    imageColor: '#ec4899',
    category: ['dress'],
    sizeMatch: 'good',
    sponsored: true,
    url: '#',
  },
  {
    id: '4',
    name: '레귤러핏 옥스포드 셔츠',
    price: 35000,
    shop: '29CM',
    imageColor: '#10b981',
    category: ['tshirt', 'long_sleeve'],
    sizeMatch: 'good',
    sponsored: false,
    url: '#',
  },
  {
    id: '5',
    name: '울 블렌드 싱글 자켓',
    price: 129000,
    shop: '무신사',
    imageColor: '#374151',
    category: ['jacket'],
    sizeMatch: 'perfect',
    sponsored: false,
    url: '#',
  },
  {
    id: '6',
    name: '와이드 핏 코튼 팬츠',
    price: 42000,
    shop: '29CM',
    imageColor: '#78716c',
    category: ['pants'],
    sizeMatch: 'good',
    sponsored: true,
    url: '#',
  },
  {
    id: '7',
    name: '크롭 카디건 니트 세트',
    price: 58000,
    shop: '지그재그',
    imageColor: '#f59e0b',
    category: ['tshirt', 'long_sleeve', 'jacket'],
    sizeMatch: 'perfect',
    sponsored: false,
    url: '#',
  },
  {
    id: '8',
    name: '플리츠 미디 스커트 원피스',
    price: 79000,
    shop: 'W컨셉',
    imageColor: '#8b5cf6',
    category: ['dress'],
    sizeMatch: 'perfect',
    sponsored: false,
    url: '#',
  },
];
