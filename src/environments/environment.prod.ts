import { apiEndpoints } from './api-endpoints';

export const environment = {
  production: true,
  salesCreditBaseApi: '/api/v1',

  ...apiEndpoints,
};
