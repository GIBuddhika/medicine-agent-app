import { Injectable } from "@angular/core";
import { Subject, Observable, throwError } from "rxjs";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { map, catchError } from "rxjs/operators";
import { RuntimeEnvLoaderService } from "./runtime-env-loader.service";
import { HandleErrorsService } from "./handle-errors.service";


@Injectable({
  providedIn: "root"
})
export class ShopAdminsService {
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
    private envLoader: RuntimeEnvLoaderService,
    private handleErrorsService: HandleErrorsService
  ) {
    this.basePath = envLoader.config.API_BASE_URL;
    this.token = localStorage.getItem("token");
    this.userId = localStorage.getItem("userId");
  }

  getAll(): Observable<any> {
    const headers = new HttpHeaders().set("security-token", this.token);
    return this.http
      .get<any>(this.basePath + "/shop-admins", {
        headers
      })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleErrorsService.handle)
      );
  }

  create(data): Observable<any> {
    const params = new HttpParams()
      .set("name", data["name"])
      .set("phone", data["phone"])
      .set("email", data["email"])
      .set("password", data["password"])
      .set("confirm_password", data["confirmPassword"])
      .set("shop_ids", data["shop_ids"]);

    const headers = new HttpHeaders().set("security-token", this.token);
    return this.http
      .post<any>(this.basePath + "/shop-admins", params, {
        headers
      })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleErrorsService.handle)
      );
  }

  update(id, data): Observable<any> {
    const params = new HttpParams()
      .set("name", data["name"])
      .set("phone", data["phone"])
      .set("email", data["email"])
      .set("password", data["password"])
      .set("confirm_password", data["confirmPassword"])
      .set("shop_ids", data["shop_ids"]);

    const headers = new HttpHeaders().set("security-token", this.token);
    return this.http
      .patch<any>(this.basePath + "/shop-admins/" + id, params, {
        headers
      })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleErrorsService.handle)
      );
  }

  delete(id): Observable<any> {
    const headers = new HttpHeaders().set("security-token", this.token);
    return this.http
      .delete<any>(this.basePath + "/shop-admins/" + id, {
        headers
      })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleErrorsService.handle)
      );
  }
}
