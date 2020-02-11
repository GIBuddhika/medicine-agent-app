import { Injectable } from '@angular/core';
import { Subject, Observable, throwError, of } from "rxjs";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { map, catchError } from "rxjs/operators";

import { RuntimeEnvLoaderService } from '../runtime-env-loader.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  basePath: string;

  constructor(
    private http: HttpClient,
    private runtimeEnvLoaderService: RuntimeEnvLoaderService,
  ) {
    this.basePath = runtimeEnvLoaderService.config.API_BASE_URL;
  }


  createAccount(data): Observable<any> {
    return this.http.post<any>(this.basePath + "/create-account", data).pipe(
      map(response => {
        return response;
      }), catchError((error) => {
        return throwError(error.error);
        // return of(error.error);
      })
    )
  }

  signIn(data): Observable<any> {
    return this.http.post<any>(this.basePath + "/sign-in", data).pipe(
      map(response => {
        return response;
      }), catchError((error) => {
        return throwError(error);
        // return of(error.error);
      })
    )
  }

}
