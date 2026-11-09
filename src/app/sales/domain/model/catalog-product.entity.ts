import { BaseEntity, Money } from '@shared/domain';

export interface CatalogProductProps {
  id: number;
  name: string;
  sku: string;
  category: string;
  unitPrice: Money;
  stock: number;
}

export class CatalogProduct implements BaseEntity {
  readonly id: number;
  readonly name: string;
  readonly sku: string;
  readonly category: string;
  readonly unitPrice: Money;
  readonly stock: number;

  constructor(props: CatalogProductProps) {
    this.id = props.id;
    this.name = props.name;
    this.sku = props.sku;
    this.category = props.category;
    this.unitPrice = props.unitPrice;
    this.stock = props.stock;
  }

  hasStock(requestedQty: number): boolean {
    return this.stock >= requestedQty;
  }
}
