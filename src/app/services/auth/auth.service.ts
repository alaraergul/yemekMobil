import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { API_URL, Error, Gender, User } from 'src/app/utils';
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: "root" })
export class AuthService {
  public isLogged$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public user$: Promise<User | null> = Promise.resolve(null);
  public error$?: Promise<Error>;

  constructor(private http: HttpClient) {}

  get isLogged() {
    return this.isLogged$.getValue();
  }

  public onLogin(fn: (value: boolean) => any) {
    this.isLogged$.subscribe((value) => {
      if (value) fn(value);
    });
  }

  async initialize() {
    return new Promise(async (resolve) => {
      const {value: username} = await Preferences.get({"key": "username"});
      const {value: password} = await Preferences.get({"key": "password"});

      if (!username || !password) return resolve(false);

      this.http.post<User | Error>(`${API_URL}/users/login`, { username, password }).subscribe(async (response) => {
        if (response && (response as Error).code) {
          this.error$ = Promise.resolve(response as Error);
          return resolve(false);
        }

        this.user$ = Promise.resolve(response as User);
        this.isLogged$.next(true);
        resolve(true);
      });
    });
  }

  getLimits(user: User) {
    const genderEnum = user.gender || Gender.MALE;
    const purineFactor = (genderEnum === Gender.MALE) ? 4 : 3;
    const kcalFactor = (genderEnum === Gender.MALE) ? 30 : 25;
    const kcalLimit = (user.kcalLimit && user.kcalLimit != -1) ? user.kcalLimit : (user.weight * kcalFactor);

    return {
      purineLimit: (user.purineLimit && user.purineLimit != -1) ? user.purineLimit : (user.weight * purineFactor + 200),
      sugarLimit: (user.sugarLimit && user.sugarLimit != -1) ? user.sugarLimit : (kcalLimit * 0.05 / 4),
      kcalLimit
    };
  }

  async editUser(purineLimit?: number, sugarLimit?: number, kcalLimit?: number, gender?: Gender, weight?: number) {
    const user = await this.user$;
    const {value: username} = await Preferences.get({"key": "username"});
    const {value: password} = await Preferences.get({"key": "password"});

    const updates = { 
      purineLimit, 
      sugarLimit, 
      kcalLimit, 
      gender,
      weight, 
      username, 
      password 
    };

    return new Promise((resolve) => {
      this.http.patch<"" | Error>(`${API_URL}/users/${user.id}`, updates).subscribe(async (response) => {
        if (response && (response as Error).code) {
          return resolve(false);
        }

        const currentUser = await this.user$;

        if (currentUser) {
          const updatedUser = { ...currentUser, ...{ purineLimit, sugarLimit, kcalLimit, gender, weight } };
          this.user$ = Promise.resolve(updatedUser);
        }

        return resolve(true);
      });
    });
  }

  register(username: string, password: string, weight: number, gender: Gender): Promise<boolean> {
    this.error$ = undefined;

    return new Promise(async (resolve) => {
      if (!username || !password || !weight) return resolve(false);

      this.http.post<User | Error>(`${API_URL}/users/register`, { username, password, weight, gender }).subscribe(async (response) => {
        if (response && (response as Error).code) {
          this.error$ = Promise.resolve(response as Error);
          return resolve(false);
        }

        this.user$ = Promise.resolve(response as User);
        this.isLogged$.next(true);
        await Preferences.set({"key": "username", "value": username});
        await Preferences.set({"key": "password", "value": password});

        return resolve(true);
      });
    });
  }

  login(username: string, password: string): Promise<boolean> {
    this.error$ = undefined;

    return new Promise(async (resolve) => {
      this.http.post<User | Error>(`${API_URL}/users/login`, { username, password }).subscribe(async (response) => {
        if (response && (response as Error).code) {
          this.error$ = Promise.resolve(response as Error);
          return resolve(false);
        }

        this.user$ = Promise.resolve(response as User);
        this.isLogged$.next(true);
        await Preferences.set({"key": "username", "value": username});
        await Preferences.set({"key": "password", "value": password});

        return resolve(true);
      });
    });
  }

  async logout(): Promise<void> {
    this.error$ = undefined;
    this.user$ = Promise.resolve(null);
    this.isLogged$.next(false);
    await Preferences.remove({"key": "username"});
    await Preferences.remove({"key": "password"});
  }
}