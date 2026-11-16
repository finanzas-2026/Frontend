import { DomainError } from '@shared/domain';

export const IamErrorCodes = Object.freeze({
  REQUIRED_FIELD: 'IAM_REQUIRED_FIELD',
  INVALID_ID: 'IAM_INVALID_ID',
  INVALID_EMAIL: 'IAM_INVALID_EMAIL',
  INVALID_ROLE: 'IAM_INVALID_ROLE',
  INVALID_USER_STATUS: 'IAM_INVALID_USER_STATUS',
  INVALID_STORE_ASSOCIATION: 'IAM_INVALID_STORE_ASSOCIATION',
  INVALID_TAX_ID: 'IAM_INVALID_TAX_ID',
  INVALID_STORE_STATUS: 'IAM_INVALID_STORE_STATUS',
  INVALID_DATE: 'IAM_INVALID_DATE',
} as const);

export type IamErrorCode = (typeof IamErrorCodes)[keyof typeof IamErrorCodes];

/**
 * Domain error for IAM invariants. It carries no HTTP semantics; Presentation
 * is responsible for translating the code into a response.
 */
export class IamDomainError extends DomainError {
  constructor(code: IamErrorCode, message: string, details?: unknown) {
    super(code, message, details);
    this.name = 'IamDomainError';
    Object.setPrototypeOf(this, IamDomainError.prototype);
  }

  static requiredField(field: string): IamDomainError {
    return new IamDomainError(
      IamErrorCodes.REQUIRED_FIELD,
      `El campo "${field}" es obligatorio.`,
      { field }
    );
  }

  static invalidId(entity: string, value: number): IamDomainError {
    return new IamDomainError(
      IamErrorCodes.INVALID_ID,
      `El identificador de ${entity} debe ser un entero positivo (recibido: ${value}).`,
      { entity, value }
    );
  }

  static invalidEmail(value: string): IamDomainError {
    return new IamDomainError(
      IamErrorCodes.INVALID_EMAIL,
      `El correo electrónico "${value}" no tiene un formato válido.`,
      { value }
    );
  }

  static invalidRole(value: string): IamDomainError {
    return new IamDomainError(
      IamErrorCodes.INVALID_ROLE,
      `El rol "${value}" no es válido.`,
      { value }
    );
  }

  static invalidUserStatus(value: string): IamDomainError {
    return new IamDomainError(
      IamErrorCodes.INVALID_USER_STATUS,
      `El estado de usuario "${value}" no es válido.`,
      { value }
    );
  }

  static invalidStoreAssociation(reason: string): IamDomainError {
    return new IamDomainError(
      IamErrorCodes.INVALID_STORE_ASSOCIATION,
      `La asociación entre usuario y tienda no es válida: ${reason}`,
      { reason }
    );
  }

  static invalidTaxId(value: string): IamDomainError {
    return new IamDomainError(
      IamErrorCodes.INVALID_TAX_ID,
      `El RUC "${value}" debe tener exactamente 11 dígitos.`,
      { value }
    );
  }

  static invalidStoreStatus(value: string): IamDomainError {
    return new IamDomainError(
      IamErrorCodes.INVALID_STORE_STATUS,
      `El estado de tienda "${value}" no es válido.`,
      { value }
    );
  }

  static invalidDate(field: string): IamDomainError {
    return new IamDomainError(
      IamErrorCodes.INVALID_DATE,
      `La fecha "${field}" no es válida.`,
      { field }
    );
  }
}
