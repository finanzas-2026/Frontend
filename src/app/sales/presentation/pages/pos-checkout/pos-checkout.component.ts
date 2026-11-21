import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent, SolCurrencyPipe, LoadingStateComponent } from '@shared/index';
import { PaymentMode, PaymentModes } from '@shared/domain';
import { ScheduleTableComponent } from '@financing';
import { CartStore } from '../../state/cart.store';
import { CatalogProduct } from '../../../domain/model/catalog-product.entity';

@Component({
  selector: 'app-pos-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatRadioModule,
    MatIconModule,
    PageHeaderComponent,
    LoadingStateComponent,
    SolCurrencyPipe,
    ScheduleTableComponent,
  ],
  templateUrl: './pos-checkout.component.html',
  styleUrl: './pos-checkout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosCheckoutPageComponent implements OnInit {
  readonly store = inject(CartStore);
  readonly modes = PaymentModes;
  searchQuery = '';

  ngOnInit(): void {
    void this.store.loadInitialData();
  }

  filteredProducts(): CatalogProduct[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      return this.store.products();
    }
    return this.store.products().filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }

  onCustomerChange(customerId: number): void {
    const cust = this.store.customers().find((c) => c.id === customerId) ?? null;
    this.store.selectCustomer(cust);
  }

  onPaymentModeChange(mode: PaymentMode): void {
    this.store.setPaymentMode(mode);
  }

  onGraceChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.store.setInstallmentParams({ graceDays: Number(input.value) });
  }

  async onProcessSale(): Promise<void> {
    await this.store.submitSale();
  }
}
