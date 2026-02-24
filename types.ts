
export interface Product {
  ean: string;
  codigo: string;
  descricao: string;
}

export interface InventoryItem extends Product {
  quantidade: number;
}

export interface User {
  username: string;
  role: 'admin' | 'user';
}

export type View = 'consulta' | 'database' | 'inventario';
