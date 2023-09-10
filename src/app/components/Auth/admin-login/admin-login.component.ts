import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { AuthService } from 'app/services/auth/auth.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { UpdateMainViewSharedService } from 'app/shared-services/update-main-view.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserRolesConstants } from 'app/constants/user-roles';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent implements OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject<void>();

  errorMessage: any;
  isSubmitted: boolean = false;
  loginForm: FormGroup;
  submitting: boolean = false;
  redirect: string = "";

  focus;
  focus1;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private updateMainViewSharedService: UpdateMainViewSharedService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.route.queryParams.subscribe((params) => {
      this.redirect = params['redirect'];
    });
    if (localStorage.getItem("token")) {
      if (this.redirect) {
        window.location.href = this.redirect;
      } else {
        if (localStorage.getItem("first_time_login") == "true") {
          localStorage.removeItem("first_time_login")
          this.router.navigate(['/']);
        } else {
          this.updateMainViewSharedService.updateMainView("login");
        }
      }
    } else {
      this.updateMainViewSharedService.updateMainView("login");
    }
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
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("is_admin");
    localStorage.removeItem("is_shop_admin");

    this.errorMessage = '';
    this.isSubmitted = true;
    if (!this.loginForm.valid) {
      return false;
    }
    this.submitting = true;

    var submitData = {
      email: this.loginForm.controls.email.value,
      password: this.loginForm.controls.password.value,
      isAdmin: 1
    };

    this.authService.login(submitData)
      .pipe(takeUntil(this.destroy$))
      .pipe(finalize(() => {
        this.submitting = false;
      }))
      .subscribe(response => {
        localStorage.setItem("token", response.authSession.token);
        localStorage.setItem("userId", response.user.id);
        if (response.user.is_admin == true) {
          if (response.user.owner_id == null) {
            localStorage.setItem("user_role", UserRolesConstants.ADMIN.toString());
          } else {
            localStorage.setItem("user_role", UserRolesConstants.SHOP_ADMIN.toString());
          }
        }
        localStorage.setItem("first_time_login", "true");
        localStorage.setItem("account_type", response.user.admin_account_type);
        window.location.reload();
      }, errors => {
        this.errorMessage = '<div class="text-center">Email or password invalid.</div>';
      });
  }
}
