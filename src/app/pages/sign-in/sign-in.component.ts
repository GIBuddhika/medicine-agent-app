import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { ValidationMessagesHelper } from 'src/app/helpers/validation-messages.helper';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})

export class SignInComponent implements OnInit {

  signInForm: FormGroup;
  errorMessage: string = "";
  isSigningUp: boolean = false;

  constructor(
    public validationMessagesHelper: ValidationMessagesHelper,
    public authService: AuthService,
    public toastrService: ToastrService,
  ) { }

  ngOnInit() {
    this.signInForm = new FormGroup({
      email: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required])
    });
  }

  signIn() {
    this.isSigningUp = false;
    this.errorMessage = null;
    var form = this.signInForm;

    this.validationMessagesHelper.showErrorMessages(form);

    if (!form.valid) {
      return;
    }

    var credentials = form.value;

    var data = {
      email: credentials.email,
      password: credentials.password
    }

    this.isSigningUp = true;
    this.authService.signIn(data)
      .pipe(finalize(() => {
        this.isSigningUp = false;
      }))
      .subscribe(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user_id', res.user_id);
        //redirect to mainpage.
      }, error => {
        if (error.status == 404) {
          this.errorMessage = '<div class="btn btn-danger btn-block text-center">Email or password invalid</div>';
        }
      });
  }
}
