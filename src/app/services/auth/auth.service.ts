import { Injectable } from "@angular/core";
import { Subject, Observable, throwError } from "rxjs";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { map, catchError } from "rxjs/operators";

import { RuntimeEnvLoaderService } from "../runtime-env-loader.service";

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
    private envLoader: RuntimeEnvLoaderService
  ) {
    this.basePath = envLoader.config.API_BASE_URL;
  }

  signup(query: object): Observable<any> {
    const params = new HttpParams()
      .set("email", query["email"])
      .set("password", query["password"])
      .set("confirm_password", query["confirmPassword"])

    return this.http.post<any>(this.basePath + "/create-account", params).pipe(
      map(response => {
        return response.data;
      }),
      catchError(this.handleError)
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
