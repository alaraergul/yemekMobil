export const API_URL = "https://demo.bussion.com/purin";

export enum DataType {
  NONE,
  PURINE,
  KCAL,
  SUGAR
};

export enum Risk {
  LOW,
  MEDIUM,
  HIGH
};

export enum Gender {
  MALE,
  FEMALE
};

export enum Language {
  TURKISH,
  ENGLISH
};

export interface User {
  id: string;
  username?: string;
  weight: number;
  sugarLimit?: number;
  purineLimit?: number;
  kcalLimit?: number;
  waterLimit?: number;
  gender: Gender;
};

export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
};
