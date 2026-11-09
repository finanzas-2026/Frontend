import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import {
  DataTableColumn,
  DataTableComponent,
  LoadingStateComponent,
  PageHeaderComponent,
} from '@shared/index';
import { Sale } from '../../../domain/model/sale.entity';
import { ListSalesUseCase } from '../../../application/use-cases/list-sales.use-case';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    PageHeaderComponent,
    DataTableComponent,
    LoadingStateComponent,
  ],
  templateUrl: './sales-history.component.html',
  styleUrl: './sales-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesHistoryPageComponent implements OnInit {
  private readonly listSalesUseCase = inject(ListSalesUseCase);

  readonly isLoading = signal<boolean>(false);
  readonly sales = signal<Sale[]>([]);
  readonly selectedSale = signal<Sale | null>(null);

  readonly columns: DataTableColumn<Record<string, unknown>>[] = [
    { key: 'code', header: 'Código', align: 'left' },
    { key: 'customerName', header: 'Cliente', align: 'left' },
    { key: 'paymentMode', header: 'Modalidad', align: 'center' },
    { key: 'formattedTotal', header: 'Importe Total', align: 'right' },
    { key: 'status', header: 'Estado', align: 'center' },
  ];

  ngOnInit(): void {
    this.loadSales();
  }

  loadSales(): void {
    this.isLoading.set(true);
    void this.listSalesUseCase.execute().then((result) => {
      if (result.isOk()) {
        this.sales.set(result.value);
      }
      this.isLoading.set(false);
    });
  }

  tableItems(): Record<string, unknown>[] {
    return this.sales().map((sale) => ({
      id: sale.id,
      code: sale.code,
      customerName: sale.customerName,
      paymentMode: sale.paymentMode,
      formattedTotal: sale.totalAmount.toFormatted(),
      status: sale.status,
      rawSale: sale,
    }));
  }
}
