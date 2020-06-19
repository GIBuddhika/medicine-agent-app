import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { AuthService } from 'app/services/auth/auth.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { UpdateMainViewSharedService } from 'app/shared-services/update-main-view.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
    private destroy$: Subject<void> = new Subject<void>();

    errorMessage: any;
    isSubmitted: boolean = false;
    loginForm: FormGroup;
    submitting: boolean = false;

    focus;
    focus1;

    constructor(
        private formBuilder: FormBuilder,
        private authService: AuthService,
        private updateMainViewSharedService: UpdateMainViewSharedService,
        private router: Router,
    ) {
        
    }

    ngOnInit() {
        this.loginForm = this.formBuilder.group({
            email: new FormControl('', [Validators.required, Validators.email]),
            password: new FormControl('', [Validators.required]),
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onSubmit() {
        this.errorMessage = '';
        this.isSubmitted = true;
        if (!this.loginForm.valid) {
            return false;
        }
        this.submitting = true;

        var submitData = {
            email: this.loginForm.controls.email.value,
            password: this.loginForm.controls.password.value,
        };

        this.authService.login(submitData)
            .pipe(takeUntil(this.destroy$))
            .pipe(finalize(() => {
                this.submitting = false;
            }))
            .subscribe(response => {
                console.log(response);

                localStorage.setItem("token", response["token"]);
                localStorage.setItem("userId", response["user_id"]);
                this.router.navigate(['home']);
            }, errors => {
                this.errorMessage = '<div class="text-center">Email or password invalid.</div>';
            });
    }
}
