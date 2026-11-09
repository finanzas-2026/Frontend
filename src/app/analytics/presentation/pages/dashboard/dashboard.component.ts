import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { LoadingStateComponent, PageHeaderComponent } from '@shared/index';
import { DashboardStore } from '../../state/dashboard.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    PageHeaderComponent,
    LoadingStateComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnInit {
  readonly store = inject(DashboardStore);

  ngOnInit(): void {
    void this.store.loadDashboardData();
  }

  getBarHeight(amount: number): number {
    const max = 20000;
    return Math.min(100, Math.round((amount / max) * 100));
  }
}
