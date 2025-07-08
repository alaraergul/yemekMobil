import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { API_URL, Error, User } from 'src/app/utils';
import { CookieService } from 'ngx-cookie-service';

@Injectable({ providedIn: "root" })
export class AuthService {
  private isLogged$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private user$: Promise<User | null> = Promise.resolve(null);
  public username?: string;
  public error$?: Promise<Error>;
  private cookieService = inject(CookieService);

  constructor(private http: HttpClient) {}

  get isLogged() {
    return this.isLogged$.getValue();
  }

  async getUser() {
    return await this.user$;
  }

  async initialize() {
    return new Promise((resolve) => {
      if (typeof document !== "undefined" && document.cookie) {
        const username = document.cookie.split("username=")[1]?.split(";")[0];
        const password = document.cookie.split("password=")[1]?.split(";")[0];

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

