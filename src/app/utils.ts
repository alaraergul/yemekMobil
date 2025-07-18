export const API_URL = "https://demo.bussion.com/purin";

export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

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

export enum WaterValue {
  GLASS,
  BOTTLE
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

export interface Error {
  code: number;
  message: string;
};

export interface MealCategory {
  name: string;
  meals: Meal[];
};

export interface MealEntry {
  meal: Meal | null;
  count: number | null; // number of servings
  timestamp: number | null; // timestamp in milliseconds
};

export interface WaterConsumption {
  value: WaterValue;
  timestamp: number;
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