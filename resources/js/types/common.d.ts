/**
 * Common types used across the application
 */

// Generic record type to replace 'any' in many places
export type GenericRecord = Record<string, unknown>;

// API response type
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// User type
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
}

// Form error type
export interface FormErrors {
  [key: string]: string | string[];
}

// Event handler types
export type EventHandler<T = Element> = React.EventHandler<React.SyntheticEvent<T>>;
export type ChangeEventHandler<T = Element> = React.ChangeEventHandler<T>;
export type FormEventHandler<T = Element> = React.FormEventHandler<T>;

// Callback function types
export type VoidFunction = () => void;
export type CallbackFunction<T = void> = (...args: unknown[]) => T;
