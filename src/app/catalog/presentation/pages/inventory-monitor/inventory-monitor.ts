import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  ToastService,
} from '@shared/index';
import { AuthStore } from '../../../../iam/application/stores/auth.store';
import { ProductStore } from '../../../application/stores/product.store';
import { Product } from '../../../domain/model/product.entity';
import { formatUnit } from '../../utils/unit-label';

@Component({
  selector: 'app-inventory-monitor',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    RouterLink,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
  ],
  templateUrl: './inventory-monitor.html',
  styleUrl: './inventory-monitor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryMonitor implements OnInit {
  readonly store = inject(ProductStore);
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastService);

  readonly formatUnit = formatUnit;

  readonly editingId = signal<number | null>(null);
  readonly draftStock = signal('');
  readonly stockError = signal<string | null>(null);

  readonly hasStore = computed(() => this.authStore.currentStoreId() !== null);
  readonly rows = computed(() => this.store.activeProducts());
  readonly totalActive = computed(() => this.rows().length);
  readonly criticalCount = computed(
    () =>
      this.rows().filter(
        (product) =>
          product.currentStock > 0 && product.currentStock <= product.minStock,
      ).length,
  );
  readonly outOfStockCount = computed(
    () => this.rows().filter((product) => product.currentStock === 0).length,
  );

  ngOnInit(): void {
    if (this.hasStore()) {
      void this.loadInventory();
    }
  }

  async loadInventory(): Promise<void> {
    try {
      await this.store.loadProducts();
    } catch {
      // ProductStore exposes the error through its `error` signal.
    }
  }

  startEdit(product: Product): void {
    this.editingId.set(product.id);
    this.draftStock.set(String(product.currentStock));
    this.stockError.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.draftStock.set('');
    this.stockError.set(null);
  }

  onDraftChange(event: Event): void {
    this.draftStock.set((event.target as HTMLInputElement).value);
    this.stockError.set(null);
  }

  async saveStock(product: Product): Promise<void> {
    const value = Number(this.draftStock());
    if (!Number.isInteger(value) || value < 0) {
      this.stockError.set('El stock debe ser un entero no negativo.');
      return;
    }

    try {
      await this.store.updateStock(product.id, value);
      this.toast.success(`Stock de "${product.name}" actualizado.`);
      this.cancelEdit();
    } catch {
      this.toast.error(
        this.store.error() ?? 'No se pudo actualizar el stock del producto.',
      );
    }
  }

  availabilityLabel(product: Product): string {
    if (product.currentStock === 0) {
      return 'Agotado';
    }
    return product.currentStock <= product.minStock ? 'Stock bajo' : 'Disponible';
  }

  availabilityClass(product: Product): string {
    if (product.currentStock === 0) {
      return 'is-out';
    }
    return product.currentStock <= product.minStock ? 'is-low' : 'is-available';
  }
}
