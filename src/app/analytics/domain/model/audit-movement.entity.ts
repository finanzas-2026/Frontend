import { BaseEntity, Money } from '@shared/domain';

export type MovementEventType = 'SALE_CREATED' | 'SETTLEMENT_CUTOFF' | 'PAYMENT_RECEIVED';

export interface AuditMovementProps {
  id: number;
  timestamp: string;
  eventType: MovementEventType;
  customerName: string;
  amount: Money;
  description: string;
}

export class AuditMovement implements BaseEntity {
  readonly id: number;
  readonly timestamp: string;
  readonly eventType: MovementEventType;
  readonly customerName: string;
  readonly amount: Money;
  readonly description: string;

  constructor(props: AuditMovementProps) {
    this.id = props.id;
    this.timestamp = props.timestamp;
    this.eventType = props.eventType;
    this.customerName = props.customerName;
    this.amount = props.amount;
    this.description = props.description;
  }
}
