import { apiEndpoints } from './api-endpoints';

export const environment = {
  production: false,
  salesCreditBaseApi: '/api/v1',

  ...apiEndpoints,
};
