import { Pipe, PipeTransform } from '@angular/core';
import { Rate } from '../../domain/model/rate.vo';

@Pipe({
  name: 'precisionRate',
  standalone: true,
})
export class PrecisionRatePipe implements PipeTransform {
  transform(value: Rate | number | string | null | undefined): string {
    if (value === null || value === undefined) {
      return '0.0000000%';
    }

    if (value instanceof Rate) {
      return value.toPercentString();
    }

    const res = Rate.fromFraction(value);
    return res.isOk() ? res.value.toPercentString() : '0.0000000%';
  }
}
