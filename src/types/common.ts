/**
 * Common utility types for the application.
 * These types provide type safety for common patterns used throughout the codebase.
 */

/** 
 * Makes all properties in T optional and allows them to be undefined.
 * Useful for partial updates and form state.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] | undefined;
};

/**
 * Ensures all properties in T are required (removes undefined).
 * Useful for validated data that has passed schema validation.
 */
export type RequiredDeep<T> = {
  [K in keyof T]-?: T[K] extends object | undefined ? RequiredDeep<NonNullable<T[K]>> : T[K];
};

/**
 * Represents a value that can be in a loading state.
 * Useful for async data fetching patterns.
 */
export type LoadingState<T> = 
  | { status: 'idle'; data: undefined; error: undefined }
  | { status: 'loading'; data: undefined; error: undefined }
  | { status: 'success'; data: T; error: undefined }
  | { status: 'error'; data: undefined; error: string };

/**
 * Standard pagination metadata structure.
 * Ensures consistent pagination handling across the application.
 */
export interface PaginationMeta {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrevious: boolean;
}

/**
 * Generic paginated response wrapper.
 * Combines data with pagination metadata.
 */
export interface PaginatedResponse<T> {
  readonly data: readonly T[];
  readonly pagination: PaginationMeta;
}

/**
 * Represents a non-empty array.
 * Useful for ensuring arrays have at least one element.
 */
export type NonEmptyArray<T> = readonly [T, ...T[]];

/**
 * Utility type for handling form field errors.
 * Maps field names to error messages.
 */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Utility type for form submission states.
 * Provides type safety for form handling.
 */
export type FormState<T> = {
  readonly values: T;
  readonly errors: FieldErrors<T>;
  readonly touched: Partial<Record<keyof T, boolean>>;
  readonly isSubmitting: boolean;
  readonly isValid: boolean;
};

/**
 * Event handler type for form inputs.
 * Ensures proper typing for React form events.
 */
export type InputChangeHandler = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

/**
 * Event handler type for select elements.
 * Ensures proper typing for React select events.
 */
export type SelectChangeHandler = (event: React.ChangeEvent<HTMLSelectElement>) => void;

/**
 * Generic callback type for async operations.
 * Provides consistent error handling patterns.
 */
export type AsyncCallback<T = void> = () => Promise<T>;

/**
 * Generic callback type with parameters for async operations.
 * Provides consistent error handling patterns with parameters.
 */
export type AsyncCallbackWithParams<TParams extends readonly unknown[], TReturn = void> = (
  ...params: TParams
) => Promise<TReturn>;

/**
 * Utility type for component ref forwarding.
 * Ensures proper typing for forwardRef components.
 */
export type ComponentWithRef<TProps, TElement> = React.ForwardRefExoticComponent<
  TProps & React.RefAttributes<TElement>
>;

/**
 * Utility type for extracting array element type.
 * Useful for working with arrays in generic contexts.
 */
export type ArrayElement<TArray> = TArray extends readonly (infer TElement)[] ? TElement : never;

/**
 * Utility type for making specific properties required.
 * More precise than Partial<T> when only some properties should be required.
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Utility type for making specific properties optional.
 * More precise than Required<T> when only some properties should be optional.
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;