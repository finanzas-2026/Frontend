import { Result } from '../domain/model/result';
import { AppError } from './app-error';

export interface UseCase<TInput, TOutput> {
  execute(input: TInput): Promise<Result<TOutput, AppError>>;
}
