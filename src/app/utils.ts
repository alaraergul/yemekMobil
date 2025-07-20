import { ToastController } from "@ionic/angular";

export const API_URL = "http://localhost:8087";

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
  language: Language;
};

export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
};

export function getLanguageString(language: Language) {
  switch (language) {
    case Language.TURKISH:
      return "tr";

    case Language.ENGLISH:
      return "en";
  }
}

export enum ToastColors {
  DANGER = "danger",
  WARNING = "warning",
  SUCCESS = "success"
};

export async function presentToast(toastController: ToastController, message: string, color: ToastColors) {
  const toast = await toastController.create({
    message,
    duration: 2500,
    position: 'top',
    color
  });

  toast.present();
}