import { businessLabel } from '../../../../shared/presentation/business-labels';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiIconComponent } from '../../../../shared/presentation/components/ui-icon/ui-icon.component';
import { MatButtonModule } from '@angular/material/button';
import {
  DataTableColumn,
  DataTableComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  ToastService,
} from '@shared/index';
import { CollectionStore } from '../../state/collection.store';
import { RunCutoffUseCase } from '../../../application/use-cases/run-cutoff.use-case';

@Component({
  selector: 'app-settlements-list',
  standalone: true,
  imports: [
    CommonModule,
    UiIconComponent,
    MatButtonModule,
    PageHeaderComponent,
    DataTableComponent,
    LoadingStateComponent,
  ],
  templateUrl: './settlements-list.component.html',
  styleUrl: './settlements-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettlementsListPageComponent implements OnInit {
  readonly store = inject(CollectionStore);
  private readonly runCutoffUseCase = inject(RunCutoffUseCase);
  private readonly toast = inject(ToastService);

  readonly columns: DataTableColumn<Record<string, unknown>>[] = [
    { key: 'code', header: 'Código', align: 'left' },
    { key: 'customerName', header: 'Cliente', align: 'left' },
    { key: 'cutoffDate', header: 'Fecha Corte', align: 'center' },
    { key: 'dueDate', header: 'Vencimiento', align: 'center' },
    { key: 'principal', header: 'Capital', align: 'right' },
    { key: 'interest', header: 'Interés', align: 'right' },
    { key: 'penalty', header: 'Mora', align: 'right' },
    { key: 'total', header: 'Total Exigible', align: 'right' },
    { key: 'status', header: 'Estado', align: 'center' },
  ];

  ngOnInit(): void {
    void this.store.loadSettlements();
  }

  async onRunCutoff(): Promise<void> {
    const res = await this.runCutoffUseCase.execute();
    if (res.isOk()) {
      const count = res.value.generatedCount;
      const summary = count === 0
        ? 'No se generaron liquidaciones.'
        : count === 1
          ? 'Se generó 1 liquidación.'
          : `Se generaron ${count} liquidaciones.`;
      this.toast.success(`Corte mensual completado. ${summary}`);
      await this.store.loadSettlements();
    } else {
      this.toast.error('No se pudo ejecutar el corte mensual. Inténtalo de nuevo.');
    }
  }

  tableItems(): Record<string, unknown>[] {
    return this.store.settlements().map((s) => ({
      id: s.id,
      code: s.code,
      customerName: s.customerName,
      cutoffDate: s.cutoffDate,
      dueDate: s.dueDate,
      principal: s.principalAmount.toFormatted(),
      interest: s.compensatoryInterest.toFormatted(),
      penalty: s.penaltyAmount.toFormatted(),
      total: s.totalDue.toFormatted(),
      status: businessLabel(s.status),
    }));
  }
}
