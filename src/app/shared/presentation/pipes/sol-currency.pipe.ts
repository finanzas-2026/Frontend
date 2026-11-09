import { Pipe, PipeTransform } from '@angular/core';
import { Money } from '../../domain/model/money.vo';

@Pipe({
  name: 'solCurrency',
  standalone: true,
})
export class SolCurrencyPipe implements PipeTransform {
  transform(value: Money | number | string | null | undefined): string {
    if (value === null || value === undefined) {
      return 'S/ 0.00';
    }

    if (value instanceof Money) {
      return value.toFormatted();
    }

    if (typeof value === 'number') {
      const res = Money.fromNumber(value);
      return res.isOk() ? res.value.toFormatted() : 'S/ 0.00';
    }

    const res = Money.fromString(value);
    return res.isOk() ? res.value.toFormatted() : 'S/ 0.00';
  }
}
