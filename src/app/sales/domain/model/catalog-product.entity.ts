import { BaseEntity, Money } from '@shared/domain';

export interface CatalogProductProps {
  id: number;
  name: string;
  sku: string;
  category: string;
  unitPrice: Money;
  creditUnitPrice?: Money;
  allowsMonthlyPayments?: boolean;
  stock: number;
}

export class CatalogProduct implements BaseEntity {
  readonly id: number;
  readonly name: string;
  readonly sku: string;
  readonly category: string;
  readonly unitPrice: Money;
  readonly creditUnitPrice: Money;
  readonly allowsMonthlyPayments: boolean;
  readonly stock: number;

  constructor(props: CatalogProductProps) {
    this.id = props.id;
    this.name = props.name;
    this.sku = props.sku;
    this.category = props.category;
    this.unitPrice = props.unitPrice;
    this.creditUnitPrice = props.creditUnitPrice ?? props.unitPrice;
    this.allowsMonthlyPayments = props.allowsMonthlyPayments ?? true;
    this.stock = props.stock;
  }

  hasStock(requestedQty: number): boolean {
    return this.stock >= requestedQty;
  }
}
