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
export class MyOrdersService {
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

  //customer portal
  getMyUnCollectedOrders(): Observable<any> {
    const headers = new HttpHeaders().set("security-token", this.token);
    return this.http
      .get<any>(this.basePath + "/orders/un-collected", {
        headers
      })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleErrorsService.handle)
      );
  }

  //customer portal
  getMyCollectedOrders(): Observable<any> {
    const headers = new HttpHeaders().set("security-token", this.token);
    return this.http
      .get<any>(this.basePath + "/orders/collected", {
        headers
      })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleErrorsService.handle)
      );
  }

  //customer portal
  getMyCancelledOrders(): Observable<any> {
    const headers = new HttpHeaders().set("security-token", this.token);
    return this.http
      .get<any>(this.basePath + "/orders/cancelled", {
        headers
      })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleErrorsService.handle)
      );
  }

  //admin portal
  getMyShopOrdersAdmin(params): Observable<any> {
    const headers = new HttpHeaders().set("security-token", this.token);
    const urlParams = this.router.createUrlTree(["admin/orders/shops"], { queryParams: params });

    return this.http
      .get<any>(this.basePath + this.serializer.serialize(urlParams), {
        headers
      })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleErrorsService.handle)
      );
  }

  //admin portal
  getMyPersonalOrdersAdmin(params): Observable<any> {
    const headers = new HttpHeaders().set("security-token", this.token);
    const urlParams = this.router.createUrlTree(["admin/orders/personal"], { queryParams: params });

    return this.http
      .get<any>(this.basePath + this.serializer.serialize(urlParams), {
        headers
      })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleErrorsService.handle)
      );
  }

  markAsCollected(orderItemId, note): Observable<any> {
    const headers = new HttpHeaders().set("security-token", this.token);
    return this.http
      .patch<any>(this.basePath + "/admin/orders/item-order/" + orderItemId + "/collected", {
        admin_note: note
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

  markAsReceived(orderItemId, data): Observable<any> {
    const headers = new HttpHeaders().set("security-token", this.token);
    return this.http
      .patch<any>(this.basePath + "/admin/orders/item-order/" + orderItemId + "/received", data, {
        headers
      })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleErrorsService.handle)
      );
  }

  cancel(orderItemId, data): Observable<any> {
    const headers = new HttpHeaders().set("security-token", this.token);
    return this.http
      .patch<any>(this.basePath + "/admin/orders/item-order/" + orderItemId + "/cancel", {
        data
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
