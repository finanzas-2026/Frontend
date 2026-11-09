import { Money } from '@shared/domain';

export interface MonthlyFlowProps {
  month: string;
  salesAmount: Money;
  collectedAmount: Money;
}

export class MonthlyFlow {
  readonly month: string;
  readonly salesAmount: Money;
  readonly collectedAmount: Money;

  constructor(props: MonthlyFlowProps) {
    this.month = props.month;
    this.salesAmount = props.salesAmount;
    this.collectedAmount = props.collectedAmount;
  }
}
