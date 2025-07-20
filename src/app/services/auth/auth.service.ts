import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { API_URL, APIResponse, Gender, getLanguageString, Language, User } from 'src/app/utils';
import { Preferences } from '@capacitor/preferences';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: "root" })
export class AuthService {
  public isLogged$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public user$: Promise<User | null> = Promise.resolve(null);
  public error$?: Promise<string>;
  private translateService = inject(TranslateService);

  constructor(private http: HttpClient) {}

  public onLogin(fn: (value: boolean) => any) {
    this.isLogged$.subscribe((value) => {
      if (value) fn(value);
    });
  }

  async initialize() {
    const {value: username} = await Preferences.get({"key": "username"});
    const {value: password} = await Preferences.get({"key": "password"});

    if (!username || !password) return false;

    const response = await firstValueFrom(this.http.post<APIResponse<User>>(`${API_URL}/users/login`, { username, password }));

    if (!response.success) {
      this.error$ = Promise.resolve(response.message);
      return false;
    }

    this.user$ = Promise.resolve(response.data);
    this.translateService.use(getLanguageString(response.data.language));
    this.isLogged$.next(true);
    return true;
  }

  getLimits(user: User) {
    const genderEnum = user.gender || Gender.MALE;
    const purineFactor = (genderEnum === Gender.MALE) ? 4 : 3;
    const kcalFactor = (genderEnum === Gender.MALE) ? 30 : 25;
    const kcalLimit = user.kcalLimit || (user.weight * kcalFactor);

    return {
      purineLimit: user.purineLimit || (user.weight * purineFactor + 200),
      sugarLimit: user.sugarLimit || (kcalLimit * 0.05 / 4),
      kcalLimit,
      waterLimit: user.waterLimit || 2000
    };
  }

  async editUser(purineLimit?: number, sugarLimit?: number, kcalLimit?: number, gender?: Gender, weight?: number, language?: Language) {
    const user = await this.user$;
    const {value: username} = await Preferences.get({"key": "username"});
    const {value: password} = await Preferences.get({"key": "password"});

    const updates = { purineLimit, sugarLimit, kcalLimit, gender, weight, username, password, language };
    const response = await firstValueFrom(this.http.patch<APIResponse<void>>(`${API_URL}/users/${user.id}`, updates));

    if (!response.success) {
      this.error$ = Promise.resolve(response.message);
      return false;
    }

    const currentUser = await this.user$;

    if (currentUser) {
      const updatedUser = { ...currentUser, ...{ purineLimit, sugarLimit, kcalLimit, gender, weight, language } };
      this.user$ = Promise.resolve(updatedUser);
      this.translateService.use(getLanguageString(updatedUser.language));
    }

    return true;
  }

  async register(username: string, password: string, weight: number, gender: Gender, language: Language): Promise<boolean> {
    this.error$ = undefined;
    if (!username || !password || !weight) return false;

    const data = { username, password, weight, gender, language };
    const response = await firstValueFrom(this.http.post<APIResponse<User>>(`${API_URL}/users/register`, data));

    if (!response.success) {
      this.error$ = Promise.resolve(response.message);
      return false;
    }

    this.user$ = Promise.resolve(response.data);
    this.isLogged$.next(true);
    await Preferences.set({"key": "username", "value": username});
    await Preferences.set({"key": "password", "value": password});

    return true;
  }

  async login(username: string, password: string): Promise<boolean> {
    this.error$ = undefined;
    if (!username || !password) return false;

    const response = await firstValueFrom(this.http.post<APIResponse<User>>(`${API_URL}/users/login`, { username, password }));

    if (!response.success) {
      this.error$ = Promise.resolve(response.message);
      return false;
    }

    this.user$ = Promise.resolve(response.data);
    this.isLogged$.next(true);
    await Preferences.set({"key": "username", "value": username});
    await Preferences.set({"key": "password", "value": password});

    return true;
  }

  async logout(): Promise<void> {
    this.error$ = undefined;
    this.user$ = Promise.resolve(null);
    this.isLogged$.next(false);
    await Preferences.remove({"key": "username"});
    await Preferences.remove({"key": "password"});
  }
}
