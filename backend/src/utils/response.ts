export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const successResponse = <T>(data: T, message = 'Success', meta?: ApiResponse['meta']): ApiResponse<T> => ({
  success: true,
  message,
  data,
  meta,
});

export const errorResponse = (message: string, error?: string): ApiResponse => ({
  success: false,
  message,
  error,
});
