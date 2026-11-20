import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SolCurrencyPipe } from '@shared/index';
import { ProductStatuses } from '../../../domain/constants/product-status.constant';
import { Product } from '../../../domain/model/product.entity';
import { formatUnit } from '../../utils/unit-label';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, SolCurrencyPipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly showAdminActions = input<boolean>(false);
  readonly edit = output<Product>();
  readonly deactivate = output<Product>();

  readonly statuses = ProductStatuses;

  private readonly imageFailed = signal(false);

  readonly isActive = computed(
    () => this.product().status === ProductStatuses.ACTIVE,
  );
  readonly isOutOfStock = computed(() => this.product().currentStock === 0);
  readonly isLowStock = computed(
    () =>
      this.product().currentStock > 0 &&
      this.product().currentStock <= this.product().minStock,
  );
  readonly availability = computed(() =>
    this.isOutOfStock()
      ? 'Agotado'
      : this.isLowStock()
        ? 'Stock bajo'
        : 'Disponible',
  );
  readonly availabilityClass = computed(() =>
    this.isOutOfStock()
      ? 'is-out'
      : this.isLowStock()
        ? 'is-low'
        : 'is-available',
  );
  readonly brandLabel = computed(() => this.product().brand?.trim() || 'Sin marca');
  readonly unitLabel = computed(() => formatUnit(this.product().unitOfMeasure));
  readonly showImage = computed(
    () => Boolean(this.product().imageUrl) && !this.imageFailed(),
  );

  onImageError(): void {
    this.imageFailed.set(true);
  }

  onEdit(): void {
    this.edit.emit(this.product());
  }

  onDeactivate(): void {
    this.deactivate.emit(this.product());
  }
}
