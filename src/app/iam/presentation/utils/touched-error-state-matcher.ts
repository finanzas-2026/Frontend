import { AbstractControl } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

/**
 * Displays validation errors only for controls the user has already touched.
 *
 * The registration wizard shares a single form across its three steps. Without
 * this matcher, submitting step 1 marks the whole form as submitted and the
 * still-empty fields of step 2 appear in an error state before the user
 * reaches them.
 */
export class TouchedErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: AbstractControl | null): boolean {
    return !!control && control.invalid && control.touched;
  }
}
