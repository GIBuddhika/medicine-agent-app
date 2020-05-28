import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class RuntimeEnvLoaderService {
    private env;

    constructor(private injector: Injector) { }

    loadAppConfig() {
        const http = this.injector.get(HttpClient);

        return http.get('/assets/env.json', {
            headers: { 'X-Skip-Intercept': 'true' },
        })
            .toPromise()
            .then(data => {
                this.env = data;
            });
    }

    get config() {
        return this.env;
    }
}