import { Routes } from '@angular/router';
import { SimulatorComponent } from './pages/simulator/simulator.component';

export const financingRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'simulator',
  },
  {
    path: 'simulator',
    component: SimulatorComponent,
  },
];
