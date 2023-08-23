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
export class ReviewsService {
  private loggedUser: Subject<any> = new Subject<any>();

  basePath: string;
  token: string;
  userRoleNameOwner: string;
  userRoleNameManager: string;
  userRoleNameAdmin: string;
  userRoleNameShipReceive: any;
  userId: string;
  constructor(
    private router: Router,
    private serializer: UrlSerializer,
    private http: HttpClient,
    private envLoader: RuntimeEnvLoaderService,
    private handleErrorsService: HandleErrorsService
  ) {
    this.basePath = envLoader.config.API_BASE_URL;
    this.token = localStorage.getItem("token");
    this.userId = localStorage.getItem("userId");
  }

  getAll(params): Observable<any> {
    const headers = new HttpHeaders().set("security-token", this.token);
    const urlParams = this.router.createUrlTree(["reviews"], { queryParams: params });

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

  create(data): Observable<any> {
    const headers = new HttpHeaders().set("security-token", this.token);
    return this.http
      .post<any>(this.basePath + "/reviews", data, {
        headers
      })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleErrorsService.handle)
      );
  }

  update(reviewId, data): Observable<any> {
    const headers = new HttpHeaders().set("security-token", this.token);
    return this.http
      .patch<any>(this.basePath + "/reviews/" + reviewId, data, {
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
      .delete<any>(this.basePath + "/reviews/" + id, {
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
