import { UserRole } from '../../domain/constants/user-roles.constant';

export interface AuthIdentityDto {
  userId: number;
  username: string;
  email: string;
  userType: UserRole;
  storeId: number | null;
}

export interface SignInResponseDto extends AuthIdentityDto {
  token: string;
}
