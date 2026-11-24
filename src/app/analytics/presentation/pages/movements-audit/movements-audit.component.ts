import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  private readonly timestampFormatter = new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  readonly columns: DataTableColumn<Record<string, unknown>>[] = [
    { key: 'timestamp', header: 'Fecha y hora (Lima)', align: 'left' },
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
      timestamp: this.formatTimestamp(m.timestamp),
      eventType: this.eventTypeLabel(m.eventType),
      customerName: m.customerName,
      description: m.description,
      amount: m.amount.toFormatted(),
    }));
  }

  private formatTimestamp(value: string): string {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? 'Fecha no disponible' : this.timestampFormatter.format(timestamp);
  }

  private eventTypeLabel(eventType: string): string {
    switch (eventType) {
      case 'SALE_CREATED': return 'Venta registrada';
      case 'SETTLEMENT_CUTOFF': return 'Cierre mensual';
      case 'PAYMENT_RECEIVED': return 'Pago recibido';
      default: return eventType;
    }
  }
}
