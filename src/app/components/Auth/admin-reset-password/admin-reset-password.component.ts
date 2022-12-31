import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'app/services/auth/auth.service';
import { UpdateMainViewSharedService } from 'app/shared-services/update-main-view.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-admin-reset-password',
  templateUrl: './admin-reset-password.component.html',
  styleUrls: ['./admin-reset-password.component.scss']
})
export class AdminResetPasswordComponent implements OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject<void>();

  errorMessage: any;
  isSubmitted: boolean = false;
  passwordResetForm: FormGroup;
  submitting: boolean = false;
  redirect: string = "";
  token: string = "";
  email: string = "";
  showMessage: boolean = false;

  focus;
  focus1;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private updateMainViewSharedService: UpdateMainViewSharedService,
    private route: ActivatedRoute
  ) {
    this.updateMainViewSharedService.updateMainView("password-reset-request");
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.token = params.token;
      this.email = params.email;
    });
    this.passwordResetForm = this.formBuilder.group({
      email: new FormControl(this.email, [Validators.email]),
      password: new FormControl('', [Validators.required]),
      confirmPassword: new FormControl('', [Validators.required]),
    }, {
      validator: this.checkPasswords
    });
  }

  checkPasswords(group: FormGroup) {
    let pass = group.get('password').value;
    let confirmPass = group.get('confirmPassword').value;
    if (pass && confirmPass) {
      return pass === confirmPass ? null : { notSame: true }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit() {
    this.errorMessage = null;
    this.isSubmitted = true;
    if (!this.passwordResetForm.valid) {
      return false;
    }
    this.submitting = true;

    var submitData = {
      email: this.email,
      password: this.passwordResetForm.controls.password.value,
      confirmPassword: this.passwordResetForm.controls.confirmPassword.value,
      token: this.token,
      is_admin: 1,
    };

    this.authService.resetPassword(submitData)
      .pipe(takeUntil(this.destroy$))
      .pipe(finalize(() => {
        this.submitting = false;
      }))
      .subscribe(response => {
        this.showMessage = true;
      }, error => {
        if (error.errors) {
          if (error.errors.error_message == "expired_token") {
            this.errorMessage = 'Your password reset link has been expired or invalid. Please try again.';
          }
        } else if (error.code == 500) {
          this.errorMessage = 'Something went wrong';
        } else {
          this.errorMessage = 'Something went wrong';
        }
      });
  }
}
