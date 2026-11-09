import { BaseEntity, Money } from '@shared/domain';

export interface SaleDetailProps {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  unitPrice: Money;
  quantity: number;
  subtotal: Money;
}

export interface NewSaleDetailInput {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  unitPrice: Money;
  quantity: number;
}

export class SaleDetail implements BaseEntity {
  readonly id: number;
  readonly productId: number;
  readonly productName: string;
  readonly sku: string;
  readonly unitPrice: Money;
  readonly quantity: number;
  readonly subtotal: Money;

  constructor(props: SaleDetailProps) {
    this.id = props.id;
    this.productId = props.productId;
    this.productName = props.productName;
    this.sku = props.sku;
    this.unitPrice = props.unitPrice;
    this.quantity = props.quantity;
    this.subtotal = props.subtotal;
  }

  static create(input: NewSaleDetailInput): SaleDetail {
    const subtotal = input.unitPrice.multiply(input.quantity);
    return new SaleDetail({
      id: input.id,
      productId: input.productId,
      productName: input.productName,
      sku: input.sku,
      unitPrice: input.unitPrice,
      quantity: input.quantity,
      subtotal,
    });
  }
}
