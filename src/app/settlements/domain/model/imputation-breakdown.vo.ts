import { Money } from '@shared/domain';

export interface ImputationBreakdownProps {
  amountPaid: Money;
  appliedToMoratorium: Money;
  appliedToCompensatory: Money;
  appliedToPrincipal: Money;
  creditBalance: Money;
  remainingDebt: Money;
}

export class ImputationBreakdown {
  readonly amountPaid: Money;
  readonly appliedToMoratorium: Money;
  readonly appliedToCompensatory: Money;
  readonly appliedToPrincipal: Money;
  readonly creditBalance: Money;
  readonly remainingDebt: Money;

  constructor(props: ImputationBreakdownProps) {
    this.amountPaid = props.amountPaid;
    this.appliedToMoratorium = props.appliedToMoratorium;
    this.appliedToCompensatory = props.appliedToCompensatory;
    this.appliedToPrincipal = props.appliedToPrincipal;
    this.creditBalance = props.creditBalance;
    this.remainingDebt = props.remainingDebt;
  }
}
