import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { API_URL, Error, User } from 'src/app/utils';

describe("AuthService", () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    document.cookie = "";
  });

  it("should login successfully and set cookies", (done) => {
    const mockUser: User = {
      id: "1",
      username: "test",
      weight: 70
    };

    service.login("test", "1234").then((result) => {
      expect(result).toBeTrue();
      expect(service.isLogged).toBeTrue();
      expect(service.username).toBe("test");
      expect(document.cookie.includes("username=test")).toBeTrue();
      done();
    });

    const req = httpMock.expectOne(`${API_URL}/users/login`);
    expect(req.request.method).toBe("POST");
    req.flush(mockUser);
  });

  it("should fail login and set error$", (done) => {
    const mockError: Error = {
      code: 401,
      message: "Unauthorized"
    };

    service.login("wrong", "pass").then((result) => {
      expect(result).toBeFalse();

      service.error$?.then((err) => {
        expect(err.code).toBe(401);
        done();
      });
    });

    const req = httpMock.expectOne(`${API_URL}/users/login`);
    req.flush(mockError);
  });

  it("should register and set user", () => {
    const mockUser: User = {
      id: "1",
      username: "new",
      weight: 60
    };

    service.register('new', 'pass', 60);

    const req = httpMock.expectOne(`${API_URL}/users/register`);
    expect(req.request.method).toBe('POST');
    req.flush(mockUser);

    service.getUser().then((user) => {
      expect(user?.username).toBe('new');
    });
  });

  it('should logout and clear user data', async () => {
    service.logout();

    const user = await service.getUser();
    expect(user).toBeNull();
    expect(service.isLogged).toBeFalse();
    expect(document.cookie).not.toContain("username");
  });

  it("should fetch users via GET", () => {
    const mockUsers: User[] = [
      { id: "1", username: "a", weight: 70 },
      { id: "2", username: "b", weight: 65 }
    ];

    service.getUsers().then((userIds) => {
      expect(userIds.length).toBe(2);
    });

    const req = httpMock.expectOne(`${API_URL}/users`);
    expect(req.request.method).toBe("GET");
    req.flush(mockUsers);
  });

  it("should auto-login if cookie is present", (done) => {
    document.cookie = "username=test";
    document.cookie = "password=1234";

    const mockUser: User = {
      id: "1",
      username: "test",
      weight: 70
    };

    service.initialize().then((result) => {
      expect(result).toBeTrue();
      expect(service.isLogged).toBeTrue();
      done();
    });

    const req = httpMock.expectOne(`${API_URL}/users/login`);
    req.flush(mockUser);
  });
});