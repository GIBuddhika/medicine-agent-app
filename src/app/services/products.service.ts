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
export class ProductsService {
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
    const headers = new HttpHeaders().set("security-token", this.token);
    return this.http
      .post<any>(this.basePath + "/items", data, {
        headers
      })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleErrorsService.handle)
      );
  }

  get(slug): Observable<any> {
    return this.http
      .get<any>(this.basePath + "/items/" + slug)
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleErrorsService.handle)
      );
  }

  reviews(slug, params): Observable<any> {
    const urlParams = this.router.createUrlTree(["/items/" + slug + "/reviews"], { queryParams: params });

    return this.http
      .get<any>(this.basePath + this.serializer.serialize(urlParams),
        {
          observe: 'response',
        })
      .pipe(
        map(response => {
          return response.body;
        }),
        catchError(this.handleErrorsService.handle)
      );
  }

  update(id, data): Observable<any> {
    const headers = new HttpHeaders().set("security-token", this.token);
    return this.http
      .patch<any>(this.basePath + "/items/" + id, data, {
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
      .delete<any>(this.basePath + "/items/" + id, {
        headers
      })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleErrorsService.handle)
      );
  }

  all(page = 1, perPage = 10, searchData = {}): Observable<any> {

    var params = {
      page: page,
      per_page: perPage,
      ...searchData
    };

    const urlParams = this.router.createUrlTree(["items"], { queryParams: params });

    return this.http
      .get<any>(this.basePath + this.serializer.serialize(urlParams),
        {
          observe: 'response',
        })
      .pipe(
        map((response) => {
          return {
            data: response.body,
            total_count: response.headers.get('App-Content-Full-Count')
          };
        }),
        catchError(this.handleErrorsService.handle)
      );
  }

  getSimilarProducts(page = 1, perPage = 10, searchData = {}): Observable<any> {

    var params = {
      page: page,
      per_page: perPage,
      ...searchData
    };

    const urlParams = this.router.createUrlTree(["items/similar-products"], { queryParams: params });

    return this.http
      .get<any>(this.basePath + this.serializer.serialize(urlParams),
        {
          observe: 'response',
        })
      .pipe(
        map((response) => {
          return {
            data: response.body,
            total_count: response.headers.get('App-Content-Full-Count')
          };
        }),
        catchError(this.handleErrorsService.handle)
      );
  }
}
