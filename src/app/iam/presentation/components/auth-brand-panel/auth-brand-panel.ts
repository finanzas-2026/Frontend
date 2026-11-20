import { Component, input } from '@angular/core';

/**
 * Visual brand panel shared by the public IAM pages (sign-in and sign-up).
 */
@Component({
  selector: 'app-auth-brand-panel',
  standalone: true,
  templateUrl: './auth-brand-panel.html',
  styleUrl: './auth-brand-panel.css',
})
export class AuthBrandPanel {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly features = input<readonly string[]>([]);
}
