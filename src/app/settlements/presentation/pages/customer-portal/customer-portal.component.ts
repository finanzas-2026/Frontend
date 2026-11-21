import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import {
  DataTableColumn,
  DataTableComponent,
  PageHeaderComponent,
} from '@shared/index';
import { Money } from '@shared/domain';
import { CollectionStore } from '../../state/collection.store';

@Component({
  selector: 'app-customer-portal',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    PageHeaderComponent,
    DataTableComponent,
  ],
  templateUrl: './customer-portal.component.html',
  styleUrl: './customer-portal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerPortalPageComponent implements OnInit {
  readonly store = inject(CollectionStore);

  readonly amountDue = computed(() => this.store.settlements()
    .filter((row) => !row.isPaid())
    .reduce((total, row) => total.add(row.totalDue), Money.zero()));

  readonly columns: DataTableColumn<Record<string, unknown>>[] = [
    { key: 'code', header: 'Código Cierre', align: 'left' },
    { key: 'cutoffDate', header: 'Fecha de Corte', align: 'center' },
    { key: 'dueDate', header: 'Vencimiento', align: 'center' },
    { key: 'total', header: 'Total Facturado', align: 'right' },
    { key: 'status', header: 'Estado', align: 'center' },
  ];

  ngOnInit(): void {
    void this.store.loadSettlements(false);
  }

  tableItems(): Record<string, unknown>[] {
    return this.store.settlements().map((s) => ({
      id: s.id,
      code: s.code,
      cutoffDate: s.cutoffDate,
      dueDate: s.dueDate,
      total: s.totalDue.toFormatted(),
      status: s.status,
    }));
  }
}
