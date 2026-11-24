import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { LoadingStateComponent, PageHeaderComponent, UiIconComponent } from '@shared/index';
import { DashboardStore } from '../../state/dashboard.store';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTooltipModule,
    PageHeaderComponent,
    LoadingStateComponent,
    UiIconComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnInit {
  readonly store = inject(DashboardStore);
  private readonly chartMaximum = computed(() => Math.max(
    1,
    ...this.store.monthlyFlows().flatMap((flow) => [
      flow.salesAmount.toNumber(),
      flow.collectedAmount.toNumber(),
    ]),
  ));

  ngOnInit(): void {
    void this.store.loadDashboardData();
  }

  getBarHeight(amount: number): number {
    return (amount / this.chartMaximum()) * 100;
  }
}
