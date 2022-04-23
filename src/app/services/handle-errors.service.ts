import { Injectable } from "@angular/core";
import { throwError } from "rxjs";

@Injectable({
    providedIn: "root"
})

export class HandleErrorsService {

    handle(error) {

        if(error.status==401){
            localStorage.clear();
            window.location.href = "/login";
        }
        let errorMessage = {};
        errorMessage = {
          code: `${error.status}`,
          message: `${error.message}`,
          errors: error.error
        };
        return throwError(errorMessage);
    }
}