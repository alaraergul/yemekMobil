import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { API_URL, Error, Gender, User } from 'src/app/utils';
import { CookieService } from 'ngx-cookie-service';

@Injectable({ providedIn: "root" })
export class AuthService {
  public isLogged$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private user$: Promise<User | null> = Promise.resolve(null);
  public error$?: Promise<Error>;
  private cookieService = inject(CookieService);

  constructor(private http: HttpClient) {}

  get isLogged() {
    return this.isLogged$.getValue();
  }

  public onLogin(fn: (value: boolean) => any) {
    this.isLogged$.subscribe((value) => {
      fn(value);
    });
  }

  async getUser() {
    return await this.user$;
  }

  async initialize() {
    return new Promise((resolve) => {
      if (typeof document !== "undefined" && document.cookie) {
        const username = this.cookieService.get("username");
        const password = this.cookieService.get("password");

        if (!username || !password) return resolve(false);

        this.http.post<User | Error>(`${API_URL}/users/login`, { username, password }).subscribe(async (response) => {
          if ((response as Error).code) {
            this.error$ = Promise.resolve(response as Error);
            return resolve(false);
          }

          this.user$ = Promise.resolve(response as User);
          this.isLogged$.next(true);
          resolve(true);
        });
      } else {
        resolve(false);
      }
    });
  }

  async getLimits() {
    const user = await this.getUser();
    const genderEnum = typeof user.gender === "string" ? Gender[user.gender as keyof typeof Gender] : user.gender;
    const purineFactor = (genderEnum === Gender.MALE) ? 4 : 3;
    const kcalFactor = (genderEnum === Gender.MALE) ? 30 : 25;
    const kcalLimit = (user.kcalLimit && user.kcalLimit != -1) ? user.kcalLimit : (user.weight * kcalFactor);

    return {
      purineLimit: (user.purineLimit && user.purineLimit != -1) ? user.purineLimit : (user.weight * purineFactor + 200),
      sugarLimit: (user.sugarLimit && user.sugarLimit != -1) ? user.sugarLimit : (kcalLimit * 0.5 / 4),
      kcalLimit
    };
  }

  async editUser(purineLimit?: number, sugarLimit?: number, kcalLimit?: number, gender?: Gender) {
    const user = await this.getUser();
    const username = this.cookieService.get("username");
    const password = this.cookieService.get("password");

    return new Promise((resolve) => {
      this.http.patch<"" | Error>(`${API_URL}/users/${user.id}`, { purineLimit, sugarLimit, kcalLimit, gender, username, password }).subscribe((response) => {
        if ((response as Error).code) {
          return resolve(false);
        }

        return resolve(true);
      });
    });
  }

  register(username: string, password: string, weight: number): Promise<boolean> {
    this.error$ = undefined;

    return new Promise((resolve) => {
      if (!username || !password || !weight) return resolve(false);

      this.http.post<User | Error>(`${API_URL}/users/register`, { username, password, weight }).subscribe(response => {
        if ((response as Error).code) {
          this.error$ = Promise.resolve(response as Error);
          return resolve(false);
        }

        this.user$ = Promise.resolve(response as User);
        this.isLogged$.next(true);
        this.cookieService.set("username", username);
        this.cookieService.set("password", password);

        return resolve(true);
      });
    });
  }

  login(username: string, password: string): Promise<boolean> {
    this.error$ = undefined;

    return new Promise((resolve) => {
      this.http.post<User | Error>(`${API_URL}/users/login`, { username, password }).subscribe(response => {
        if ((response as Error).code) {
          this.error$ = Promise.resolve(response as Error);
          return resolve(false);
        }

        this.user$ = Promise.resolve(response as User);
        this.isLogged$.next(true);
        this.cookieService.set("username", username);
        this.cookieService.set("password", password);

        return resolve(true);
      });
    });
  }

  logout(): void {
    this.error$ = undefined;
    this.user$ = Promise.resolve(null);
    this.isLogged$.next(false);
    this.cookieService.delete("username");
    this.cookieService.delete("password");
  }
}

