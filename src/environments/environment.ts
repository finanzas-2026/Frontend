import { apiEndpoints } from './api-endpoints';

export const environment = {
  production: false,
  demo: true,
  salesCreditBaseApi: 'http://localhost:8080/api/v1',

  ...apiEndpoints,
};
