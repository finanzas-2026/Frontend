import { apiEndpoints } from './api-endpoints';

export const environment = {
  production: true,
  demo: false,
  salesCreditBaseApi: '/api/v1',

  ...apiEndpoints,
};
