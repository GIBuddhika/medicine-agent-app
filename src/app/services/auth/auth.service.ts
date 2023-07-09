import { Injectable } from "@angular/core";
import { Subject, Observable, throwError } from "rxjs";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { map, catchError } from "rxjs/operators";

import { RuntimeEnvLoaderService } from "../runtime-env-loader.service";
import { HandleErrorsService } from "../handle-errors.service";

@Injectable({
  providedIn: "root"
})
export class AuthService {
  private loggedUser: Subject<any> = new Subject<any>();

  basePath: string;
  userRoleNameOwner: string;
  userRoleNameManager: string;
  userRoleNameAdmin: string;
  userRoleNameShipReceive: any;

  constructor(
    private http: HttpClient,
    private envLoader: RuntimeEnvLoaderService,
    private handleErrorsService: HandleErrorsService,
  ) {
    this.basePath = envLoader.config.API_BASE_URL;
  }

  signup(query: object): Observable<any> {
    const params = new HttpParams()
      .set("name", query["name"])
      .set("phone", query["phone"])
      .set("accountType", query["accountType"])
      .set("email", query["email"])
      .set("password", query["password"])
      .set("confirm_password", query["confirmPassword"])
      .set("isAdmin", query["isAdmin"])

    return this.http.post<any>(this.basePath + "/create-account", params).pipe(
      map(response => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

  login(query: object): Observable<any> {
    const params = new HttpParams()
      .set("email", query["email"])
      .set("password", query["password"])
      .set("isAdmin", query["isAdmin"]);

    return this.http.post<any>(this.basePath + "/login", params).pipe(
      map(response => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

  passwordResetRequest(query: object): Observable<any> {
    const params = new HttpParams()
      .set("email", query["email"])
      .set("is_admin", query["is_admin"])

    return this.http.post<any>(this.basePath + "/password-reset-request", params).pipe(
      map(response => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

  resetPassword(query: object): Observable<any> {
    const params = new HttpParams()
      .set("email", query["email"])
      .set("password", query["password"])
      .set("confirm_password", query["confirmPassword"])
      .set("token", query["token"])
      .set("is_admin", query["is_admin"]);

    return this.http.post<any>(this.basePath + "/reset-password", params).pipe(
      map(response => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

  validate(token, userRole): Observable<any> {
    return this.http
      .get<any>(this.basePath + "/validate?token=" + token + "&user_role=" + userRole)
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleErrorsService.handle)
      );
  }

  handleError(error) {
    let errorMessage = {};
    errorMessage = {
      code: `${error.status}`,
      message: `${error.message}`,
      errors: error.error
    };
    return throwError(errorMessage);
  }
}
