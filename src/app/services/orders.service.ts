import { Injectable } from "@angular/core";
import { Subject, Observable, throwError } from "rxjs";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { map, catchError } from "rxjs/operators";
import { RuntimeEnvLoaderService } from "./runtime-env-loader.service";
import { HandleErrorsService } from "./handle-errors.service";
import { Router, UrlSerializer } from "@angular/router";


@Injectable({
  providedIn: "root"
})
export class OrdersService {
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
    private handleErrorsService: HandleErrorsService,
    private serializer: UrlSerializer,
    private router: Router
  ) {
    this.basePath = envLoader.config.API_BASE_URL;
    this.token = localStorage.getItem("token");
    this.userId = localStorage.getItem("userId");
  }

  create(data): Observable<any> {
    console.log(data);
    const headers = new HttpHeaders().set("security-token", this.token);
    return this.http
      .post<any>(this.basePath + "/orders", data, {
        headers
      })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleErrorsService.handle)
      );
  }

  extend(data): Observable<any> {
    console.log(data);
    const headers = new HttpHeaders().set("security-token", this.token);
    return this.http
      .post<any>(this.basePath + "/orders/extend", data, {
        headers
      })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleErrorsService.handle)
      );
  }

  cancel(orderId, orderItemId): Observable<any> {
    const headers = new HttpHeaders().set("security-token", this.token);
    return this.http
      .post<any>(this.basePath + "/orders/" + orderId + "/cancel", {
        order_item_id: orderItemId
      }, {
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
