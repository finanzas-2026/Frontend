import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  ToastService,
} from '@shared/index';
import { AuthStore } from '../../../../iam/application/stores/auth.store';
import { ProductStore } from '../../../application/stores/product.store';
import {
  ProductStatus,
  ProductStatuses,
} from '../../../domain/constants/product-status.constant';
import { UnitOfMeasure, UnitOfMeasures } from '../../../domain/enums/unit-of-measure.enum';
import { Product } from '../../../domain/model/product.entity';

const integerValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return typeof value === 'number' && Number.isInteger(value)
    ? null
    : { integer: true };
};

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    RouterLink,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
  ],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductForm implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly authStore = inject(AuthStore);
  readonly store = inject(ProductStore);

  readonly units = Object.values(UnitOfMeasures);
  readonly statusOptions = [
    { value: ProductStatuses.ACTIVE, label: 'Activo' },
    { value: ProductStatuses.INACTIVE, label: 'Inactivo' },
  ] as const;
  readonly productId = signal<number | null>(null);
  readonly isEditMode = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  private readonly loadedProduct = signal<Product | null>(null);

  readonly hasStore = computed(() => this.authStore.currentStoreId() !== null);
  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Editar producto' : 'Nuevo producto',
  );
  readonly pageSubtitle = computed(() =>
    this.isEditMode()
      ? 'Actualiza la información comercial e inventario del producto.'
      : 'Registra un producto para publicarlo en el catálogo de tu tienda.',
  );
  readonly submitLabel = computed(() =>
    this.isEditMode() ? 'Guardar cambios' : 'Crear producto',
  );

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
    brand: [''],
    supplier: [''],
    unitOfMeasure: [
      UnitOfMeasures.SACO as UnitOfMeasure,
      [Validators.required],
    ],
    imageUrl: [''],
    cashPrice: [0, [Validators.required, Validators.min(0)]],
    creditListPrice: [0, [Validators.required, Validators.min(0)]],
    allowsMonthlyPayments: [false],
    currentStock: [
      0,
      [Validators.required, Validators.min(0), integerValidator],
    ],
    minStock: [0, [Validators.required, Validators.min(0), integerValidator]],
    status: [ProductStatuses.ACTIVE as ProductStatus, [Validators.required]],
  });

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    if (rawId === null) {
      return;
    }

    this.isEditMode.set(true);
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      this.loadError.set('El identificador del producto no es válido.');
      return;
    }

    this.productId.set(id);
    void this.loadProduct(id);
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    this.submitError.set(null);

    if (
      this.form.invalid ||
      this.store.isLoading() ||
      this.loadError() !== null ||
      !this.hasStore()
    ) {
      return;
    }

    try {
      const product = this.buildProduct();
      if (this.isEditMode()) {
        await this.store.updateProduct(product);
      } else {
        await this.store.createProduct(product);
      }
      this.toast.success(
        this.isEditMode()
          ? 'Producto actualizado correctamente.'
          : 'Producto registrado correctamente.',
      );
      await this.router.navigate(['/catalog/products']);
    } catch {
      this.submitError.set(
        this.store.error() ?? 'No se pudo guardar el producto.',
      );
    }
  }

  private async loadProduct(id: number): Promise<void> {
    try {
      const product = await this.store.getProductById(id);
      this.loadedProduct.set(product);
      this.form.patchValue({
        name: product.name,
        description: product.description ?? '',
        brand: product.brand ?? '',
        supplier: product.supplier ?? '',
        unitOfMeasure: product.unitOfMeasure,
        imageUrl: product.imageUrl ?? '',
        cashPrice: product.cashPrice,
        creditListPrice: product.creditListPrice,
        allowsMonthlyPayments: product.allowsMonthlyPayments,
        currentStock: product.currentStock,
        minStock: product.minStock,
        status: product.status,
      });
    } catch {
      this.loadError.set(
        this.store.error() ?? 'No se pudo cargar el producto solicitado.',
      );
    }
  }

  private buildProduct(): Product {
    const value = this.form.getRawValue();
    const current = this.loadedProduct();

    return {
      id: this.productId() ?? Date.now(),
      storeId: current?.storeId ?? this.authStore.currentStoreId() ?? 0,
      name: value.name.trim(),
      description: optionalText(value.description),
      brand: optionalText(value.brand),
      supplier: optionalText(value.supplier),
      unitOfMeasure: value.unitOfMeasure,
      imageUrl: optionalText(value.imageUrl),
      cashPrice: Number(value.cashPrice),
      creditListPrice: Number(value.creditListPrice),
      allowsMonthlyPayments: value.allowsMonthlyPayments,
      currentStock: Number(value.currentStock),
      minStock: Number(value.minStock),
      status: value.status,
    };
  }
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
