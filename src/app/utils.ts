export const API_URL = "http://192.168.42.164:8087";

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
}