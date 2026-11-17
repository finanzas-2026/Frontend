export const environment = {
  production: true,
  salesCreditBaseApi: 'http://localhost:8080/api/v1',

  //TODO: able signInEndpoint: '/auth/login',
  //TODO: able signUpEndpoint: '/auth/register',
  signInEndpoint: '/users',
  signUpEndpoint: '/users',
  sessionStorageKey: 'sales_credit_active_session',

  storesEndpoint: '/stores',
  usersEndpoint: '/users',
  customersEndpoint: '/customers',
  productsEndpoint: '/products',
  salesEndpoint: '/sales',
  saleDetailsEndpoint: '/sale_details',
  monthlySettlementsEndpoint: '/monthly_settlements',
  paymentsEndpoint: '/payments',
  amortizationSchedulesEndpoint: '/amortization_schedules',

  useFakeApi: false,
  apiBaseUrl: '/api/v1',
};
