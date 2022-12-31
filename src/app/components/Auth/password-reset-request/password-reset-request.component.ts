import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { AuthService } from 'app/services/auth/auth.service';
import { UpdateMainViewSharedService } from 'app/shared-services/update-main-view.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

@Component({
    selector: 'app-login',
    templateUrl: './password-reset-request.component.html',
    styleUrls: ['./password-reset-request.component.scss']
})

export class PasswordResetRequestComponent implements OnInit, OnDestroy {
    private destroy$: Subject<void> = new Subject<void>();

    errorMessage: any;
    isSubmitted: boolean = false;
    passwordResetForm: FormGroup;
    submitting: boolean = false;
    redirect: string = "";
    showMessage: boolean = false;

    focus;
    focus1;

    constructor(
        private formBuilder: FormBuilder,
        private authService: AuthService,
        private updateMainViewSharedService: UpdateMainViewSharedService,
    ) {
        this.updateMainViewSharedService.updateMainView("password-reset-request");
    }

    ngOnInit() {
        this.passwordResetForm = this.formBuilder.group({
            email: new FormControl('', [Validators.required, Validators.email]),
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onSubmit() {
        this.errorMessage = '';
        this.isSubmitted = true;
        if (!this.passwordResetForm.valid) {
            return false;
        }
        this.submitting = true;

        var submitData = {
            email: this.passwordResetForm.controls.email.value,
            is_admin: 0,
        };

        this.authService.passwordResetRequest(submitData)
            .pipe(takeUntil(this.destroy$))
            .pipe(finalize(() => {
                this.submitting = false;
            }))
            .subscribe(response => {
                this.showMessage = true;
            }, errors => {
                this.errorMessage = '<div class="text-center">Email or password invalid.</div>';
            });
    }
}
