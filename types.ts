
export interface Product {
  ean: string;
  codigo: string;
  descricao: string;
  preco?: number;
  estoque?: number;
}

export interface InventoryItem extends Product {
  quantidade: number;
}

export interface User {
  username: string;
  role: 'admin' | 'user';
}

export type View = 'consulta' | 'database' | 'inventario';
