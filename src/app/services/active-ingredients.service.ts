import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { map, catchError } from "rxjs/operators";
import { RuntimeEnvLoaderService } from "./runtime-env-loader.service";
import { HandleErrorsService } from "./handle-errors.service";
import { Router, UrlSerializer } from "@angular/router";


@Injectable({
  providedIn: "root"
})
export class ActiveIgredientsService {
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
    private router: Router,
    private serializer: UrlSerializer,
  ) {
    this.basePath = envLoader.config.API_BASE_URL;
    this.token = localStorage.getItem("token");
  }

  getAll(searchText = ""): Observable<any> {
    var params = {
      search_text: searchText,
    };

    const urlParams = this.router.createUrlTree(["active-ingredient-names"], { queryParams: params });

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
}
