import { Injectable } from "@angular/core";
import { Subject, Observable, throwError } from "rxjs";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { map, catchError } from "rxjs/operators";
import { RuntimeEnvLoaderService } from "./runtime-env-loader.service";


@Injectable({
  providedIn: "root"
})
export class MetaService {
  private loggedUser: Subject<any> = new Subject<any>();

  basePath: string;
  token: string;
  userRoleNameOwner: string;
  userRoleNameManager: string;
  userRoleNameAdmin: string;
  userRoleNameShipReceive: any;
  userId: string;
  googleMapApiKey: string;

  constructor(
    private http: HttpClient,
    private envLoader: RuntimeEnvLoaderService
  ) {
    this.basePath = envLoader.config.API_BASE_URL;
    this.googleMapApiKey = envLoader.config.GOOGLE_MAP_API_KEY;
  }

  getDistricts(): Observable<any> {
    return this.http
      .get<any>(this.basePath + "/districts")
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleError)
      );
  }

  getCities(cityId: number): Observable<any> {
    return this.http
      .get<any>(this.basePath + "/districts/" + cityId + "/cities")
      .pipe(
        map(response => {
          return response;
        }),
        catchError(this.handleError)
      );
  }

  getAddressFromGoogleMap(lat: number, lng: number): Observable<any> {
    return this.http
      .get<any>("https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + "," + lng + "&key=" + this.googleMapApiKey)
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
