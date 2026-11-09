import { Money } from '@shared/domain';

export interface PayoffQuoteProps {
  settlementId: number;
  calculationDate: string;
  daysOverdue: number;
  overduePrincipal: Money;
  compensatoryInterest: Money;
  moratoriumInterest: Money;
  totalPayoffAmount: Money;
}

export class PayoffQuote {
  readonly settlementId: number;
  readonly calculationDate: string;
  readonly daysOverdue: number;
  readonly overduePrincipal: Money;
  readonly compensatoryInterest: Money;
  readonly moratoriumInterest: Money;
  readonly totalPayoffAmount: Money;

  constructor(props: PayoffQuoteProps) {
    this.settlementId = props.settlementId;
    this.calculationDate = props.calculationDate;
    this.daysOverdue = props.daysOverdue;
    this.overduePrincipal = props.overduePrincipal;
    this.compensatoryInterest = props.compensatoryInterest;
    this.moratoriumInterest = props.moratoriumInterest;
    this.totalPayoffAmount = props.totalPayoffAmount;
  }
}
