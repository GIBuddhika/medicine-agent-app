import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { ValidationMessagesHelper } from 'src/app/helpers/validation-messages.helper';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.scss']
})

export class CreateAccountComponent implements OnInit {

  createAccountForm: FormGroup;
  errorMessage: string = "";
  isSigningUp: boolean = false;

  constructor(
    public validationMessagesHelper: ValidationMessagesHelper,
    public authService: AuthService,
    public toastrService: ToastrService,
  ) { }

  ngOnInit() {
    this.createAccountForm = new FormGroup({
      email: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
      confirmPassword: new FormControl('', [Validators.required]),
    });
  }

  register() {
    this.isSigningUp = false;
    this.errorMessage = null;
    var form = this.createAccountForm;

    this.validationMessagesHelper.showErrorMessages(form);

    if (!form.valid) {
      return;
    }

    var credentials = form.value;

    if (credentials['password'] != credentials['confirmPassword']) {
      document.getElementById('password').setAttribute('class', 'form-control input-reqired');
      document.getElementById('confirmPassword').setAttribute('class', 'form-control input-reqired');
      this.errorMessage = '<div class="btn btn-danger btn-block text-center"> Passwords does not match! </div>';
      return false;
    }

    var data = {
      email: credentials.email,
      password: credentials.password,
      confirm_password: credentials.confirmPassword
    }

    this.isSigningUp = true;
    this.authService.createAccount(data)
      .pipe(finalize(() => {
        this.isSigningUp = false;
      }))
      .subscribe(res => {
        this.toastrService.success('Account Created.', 'Success!');
        localStorage.setItem('token', res.token);
        localStorage.setItem('user_id', res.user_id);
        //redirect to mainpage.
      }, error => {
        if (error.email == 'duplicate') {
          this.errorMessage = '<div class="btn btn-danger btn-block text-center">An account with this email already exists!</div>';
        } else {
          this.toastrService.error('Something went wrong.', 'Error!');
        }
      });
  }
}
