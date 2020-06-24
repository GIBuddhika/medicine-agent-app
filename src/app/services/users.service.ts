import { Injectable } from "@angular/core";
import { Subject, Observable, throwError } from "rxjs";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { map, catchError } from "rxjs/operators";
import { RuntimeEnvLoaderService } from "./runtime-env-loader.service";


@Injectable({
  providedIn: "root"
})
export class UsersService {
  private loggedUser: Subject<any> = new Subject<any>();

  basePath: string;
  token: string;
  userRoleNameOwner: string;
  userRoleNameManager: string;
  userRoleNameAdmin: string;
  userRoleNameShipReceive: any;
  userId: string;

  constructor(
    private http: HttpClient,
    private envLoader: RuntimeEnvLoaderService
  ) {
    this.basePath = envLoader.config.API_BASE_URL;
    this.token = localStorage.getItem("token");
    this.userId = localStorage.getItem("userId");
  }

  getShops(): Observable<any> {
    const headers = new HttpHeaders().set("security-token", this.token);
    return this.http
      .get<any>(this.basePath + "/users/" + this.userId + "/shops", {
        headers
      })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleError)
      );
  }

  getCoordinatesByAddress(address): Observable<any> {
    return this.http
      .get<any>("https://maps.google.com/maps/api/geocode/json?address=" + address + "&key=" + this.envLoader.config.GOOGLE_MAP_API_KEY, {
      })
      .pipe(
        map(response => {
          return response;
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
