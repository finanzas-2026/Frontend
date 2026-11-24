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
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  ConfirmDialogComponent,
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  ToastService,
  UiIconComponent,
} from '@shared/index';
import { AuthStore } from '../../../../iam/application/stores/auth.store';
import { ProductStore } from '../../../application/stores/product.store';
import { ProductStatus, ProductStatuses } from '../../../domain/constants/product-status.constant';
import { Product } from '../../../domain/model/product.entity';
import { ProductCard } from '../../components/product-card/product-card';

type ProductStatusFilter = ProductStatus | 'ALL';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    RouterLink,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    ProductCard,
    UiIconComponent,
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductList implements OnInit {
  readonly store = inject(ProductStore);
  private readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly statusOptions = [
    { value: ProductStatuses.AVAILABLE, label: 'Disponibles' },
    { value: ProductStatuses.OUT_OF_STOCK, label: 'Agotados' },
    { value: ProductStatuses.DISCONTINUED, label: 'Descontinuados' },
  ] as const;
  readonly searchQuery = signal('');
  readonly statusFilter = signal<ProductStatusFilter>('ALL');

  readonly hasStore = computed(() => this.authStore.currentStoreId() !== null);
  readonly totalCount = computed(() => this.store.products().length);
  readonly resultCount = computed(() => this.filteredProducts().length);
  readonly filteredProducts = computed(() => {
    const query = normalizeText(this.searchQuery());
    const filter = this.statusFilter();

    return this.store.products().filter((product) => {
      const matchesStatus = filter === 'ALL' || product.status === filter;
      const searchable = normalizeText(
        `${product.name} ${product.brand ?? ''} ${product.supplier ?? ''}`,
      );
      return matchesStatus && (!query || searchable.includes(query));
    });
  });

  ngOnInit(): void {
    if (this.hasStore()) {
      void this.loadProducts();
    }
  }

  async loadProducts(): Promise<void> {
    try {
      await this.store.loadProducts();
    } catch {
      // ProductStore exposes the error through its `error` signal.
    }
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onStatusFilterChange(value: ProductStatusFilter): void {
    this.statusFilter.set(value);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('ALL');
  }

  onEdit(product: Product): void {
    void this.router.navigate(['/catalog/products', product.id, 'edit']);
  }

  onDeactivate(product: Product): void {
    void this.confirmDeactivate(product);
  }

  private async confirmDeactivate(product: Product): Promise<void> {
    if (this.store.isLoading()) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Desactivar producto',
        message:
          `El producto "${product.name}" dejará de mostrarse en el catálogo activo. ` +
          'Sus registros históricos se conservarán.',
        confirmText: 'Desactivar',
        cancelText: 'Cancelar',
        isDestructive: true,
      },
    });
    const confirmed = await firstValueFrom(dialogRef.afterClosed());

    if (!confirmed) {
      return;
    }

    try {
      await this.store.deactivateProduct(product.id);
      this.toast.success('Producto desactivado correctamente.');
    } catch {
      this.toast.error(
        this.store.error() ?? 'No se pudo desactivar el producto.',
      );
    }
  }
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase();
}
