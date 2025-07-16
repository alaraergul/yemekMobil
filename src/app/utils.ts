export const API_URL = "https://demo.bussion.com/purin";

export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

export enum DataType {
  PURINE,
  KCAL,
  SUGAR
};

export enum Gender {
  MALE,
  FEMALE
}

export interface User {
  id: string;
  username?: string;
  weight: number;
  sugarLimit?: number;
  purineLimit?: number;
  kcalLimit?: number;
  gender: Gender;
};

export interface Error {
  code: number;
  message: string;
};

export interface MealEntry {
  meal: Meal | null;
  count: number | null; // number of servings
  timestamp: number | null; // timestamp in milliseconds
};

export interface Meal {
  id: number;
  name: string;
  purine: number; // mg
  quantity: number; // g
  kcal: number;
  sugar: number; // g
  category: string;
}