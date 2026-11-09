import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import {
  DataTableColumn,
  DataTableComponent,
  LoadingStateComponent,
  PageHeaderComponent,
} from '@shared/index';
import { DashboardStore } from '../../state/dashboard.store';

@Component({
  selector: 'app-movements-audit',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    PageHeaderComponent,
    DataTableComponent,
    LoadingStateComponent,
  ],
  templateUrl: './movements-audit.component.html',
  styleUrl: './movements-audit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementsAuditPageComponent implements OnInit {
  readonly store = inject(DashboardStore);

  readonly columns: DataTableColumn<Record<string, unknown>>[] = [
    { key: 'timestamp', header: 'Fecha / Hora', align: 'left' },
    { key: 'eventType', header: 'Tipo Evento', align: 'center' },
    { key: 'customerName', header: 'Cliente', align: 'left' },
    { key: 'description', header: 'Detalle Transaccional', align: 'left' },
    { key: 'amount', header: 'Importe (PEN)', align: 'right' },
  ];

  ngOnInit(): void {
    void this.store.loadMovements();
  }

  tableItems(): Record<string, unknown>[] {
    return this.store.movements().map((m) => ({
      id: m.id,
      timestamp: m.timestamp,
      eventType: m.eventType,
      customerName: m.customerName,
      description: m.description,
      amount: m.amount.toFormatted(),
    }));
  }
}
