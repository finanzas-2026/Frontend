import { Money, Rate } from '@shared/domain';

export interface DashboardKpisProps {
  totalRevenue: Money;
  overduePortfolio: Money;
  activeAccounts: number;
  defaultRate: Rate;
}

export class DashboardKpis {
  readonly totalRevenue: Money;
  readonly overduePortfolio: Money;
  readonly activeAccounts: number;
  readonly defaultRate: Rate;

  constructor(props: DashboardKpisProps) {
    this.totalRevenue = props.totalRevenue;
    this.overduePortfolio = props.overduePortfolio;
    this.activeAccounts = props.activeAccounts;
    this.defaultRate = props.defaultRate;
  }
}
