import { Component, output } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css',
})
export class Toolbar {
  readonly menuToggle = output<void>();

  toggleMenu(): void {
    this.menuToggle.emit();
  }
}
