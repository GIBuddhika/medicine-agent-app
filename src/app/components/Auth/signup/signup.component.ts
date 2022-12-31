import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { ValidationMessagesHelper } from 'app/helpers/validation-messages.helper';
import { AuthService } from 'app/services/auth/auth.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { UpdateMainViewSharedService } from 'app/shared-services/update-main-view.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit, OnDestroy {
    private destroy$: Subject<void> = new Subject<void>();

    errorsList = [];
    isSubmitted: boolean = false;
    signUpForm: FormGroup;
    submitting: boolean = false;

    focus;
    focus1;

    constructor(
        private validationMessagesHelper: ValidationMessagesHelper,
        private formBuilder: FormBuilder,
        private authService: AuthService,
        private updateMainViewSharedService: UpdateMainViewSharedService,
        private router: Router,
    ) {
        if (localStorage.getItem("token")) {
            this.router.navigate(['home']);
        } else {
            this.updateMainViewSharedService.updateMainView("sign-up");
        }
    }

    ngOnInit() {
        this.signUpForm = this.formBuilder.group({
            name: new FormControl('', [Validators.required]),
            phone: new FormControl('', [Validators.required, Validators.pattern('\\d{2}[- ]?\\d{3}[- ]?\\d{4}')]),
            email: new FormControl('', [Validators.required, Validators.email]),
            password: new FormControl('', [Validators.required]),
            confirmPassword: new FormControl('', [Validators.required]),
        }, {
            validator: this.checkPasswords
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    checkPasswords(group: FormGroup) {
        let pass = group.get('password').value;
        let confirmPass = group.get('confirmPassword').value;
        if (pass && confirmPass) {
            return pass === confirmPass ? null : { notSame: true }
        }
    }

    onSubmit() {
        console.log(1);

        this.errorsList = [];
        this.isSubmitted = true;
        if (!this.signUpForm.valid) {
            return false;
        }
        this.submitting = true;

        var submitData = {
            name: this.signUpForm.controls.name.value,
            phone: this.signUpForm.controls.phone.value,
            email: this.signUpForm.controls.email.value,
            password: this.signUpForm.controls.password.value,
            confirmPassword: this.signUpForm.controls.confirmPassword.value,
            isAdmin: 0
        };

        this.authService.signup(submitData)
            .pipe(takeUntil(this.destroy$))
            .pipe(finalize(() => {
                this.submitting = false;
            }))
            .subscribe(response => {
                localStorage.setItem("token", response["token"]);
                localStorage.setItem("userId", response["user_id"]);
                window.location.reload();
            }, errors => {
                if (errors.code == 400) {
                    for (let key in errors.errors) {
                        if (key == "email" && errors.errors[key].includes("duplicate")) {
                            this.errorsList.push("This email has already been used.");
                        } else {
                            this.errorsList.push("Something went wrong. Please try again.");
                        }
                    }
                } else {
                    this.errorsList.push("Something went wrong. Please try again.");
                }
            });
    }
}
