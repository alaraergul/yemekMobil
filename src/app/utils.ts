export const API_URL = "https://demo.bussion.com/purin";

export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

export interface User {
  id: string;
  username?: string;
  weight: number;
};

export interface Error {
  code: number;
  message: string;
};

export interface MealEntry {
  meal: Meal;
  count: number;
  timestamp: number;
};

export interface Meal {
  id: number;
  name: string;
  purine: number; // mg
  quantity: number; // g
  kcal: number;
  sugar: number; // g
}