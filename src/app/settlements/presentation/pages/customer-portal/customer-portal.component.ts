import { businessLabel } from '../../../../shared/presentation/business-labels';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { GetSettlementByIdUseCase } from '../../../application/use-cases/get-settlement-by-id.use-case';
import { MonthlySettlement } from '../../../domain/model/monthly-settlement.entity';
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
    MatFormFieldModule,
    MatSelectModule,
    PageHeaderComponent,
    DataTableComponent,
  ],
  templateUrl: './customer-portal.component.html',
  styleUrl: './customer-portal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerPortalPageComponent implements OnInit {
  readonly store = inject(CollectionStore);

  private readonly getSettlement = inject(GetSettlementByIdUseCase);
  private detailRequest = 0;
  readonly statement = signal<MonthlySettlement | null>(null);
  readonly detailStatus = signal<'idle' | 'loading' | 'error'>('idle');

  readonly purchaseColumns: DataTableColumn<Record<string, unknown>>[] = [
    { key: 'code', header: 'Venta' },
    { key: 'date', header: 'Fecha de compra' },
    { key: 'principal', header: 'Capital', align: 'right' },
    { key: 'interest', header: 'Interés compensatorio', align: 'right' },
    { key: 'total', header: 'Total de la compra', align: 'right' },
  ];

  readonly purchaseItems = computed(() => (this.statement()?.purchases ?? []).map((purchase) => ({
    code: purchase.saleCode,
    date: purchase.purchaseDate.split('-').reverse().join('/'),
    principal: purchase.principal.toFormatted(),
    interest: purchase.interest.toFormatted(),
    total: purchase.total.toFormatted(),
  })));

  async openStatement(id: number): Promise<void> {
    const request = ++this.detailRequest;
    this.statement.set(null);
    this.detailStatus.set('loading');
    const result = await this.getSettlement.execute(id);
    if (request !== this.detailRequest) return;
    const statement = result.isOk() ? result.value : null;
    this.statement.set(statement);
    this.detailStatus.set(statement ? 'idle' : 'error');
  }

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
      status: businessLabel(s.status),
    }));
  }
}
