export interface StoreResource {
  readonly id: number;
  readonly business_name: string;
  readonly tax_id: string;
  readonly address: string;
  readonly phone_number?: string | null;
  readonly created_at: string;
  readonly status: string;
}

export interface CreateStoreRequest {
  business_name: string;
  tax_id: string;
  address: string;
  phone_number?: string;
  admin: {
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    password: string;
  };
}

export type UpdateStoreRequest = Omit<CreateStoreRequest, 'admin'> & { status: string };
