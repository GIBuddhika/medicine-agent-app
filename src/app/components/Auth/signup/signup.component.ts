import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
    signUpForm: FormGroup;
    focus;
    focus1;
    constructor() { }

    ngOnInit() {
        this.signUpForm = new FormGroup({
            email: new FormControl('', [Validators.required, Validators.email]),
            password: new FormControl('', [Validators.required]),
            confirmPassword: new FormControl('', [Validators.required]),
        })
    }

    onSubmit() {
        console.log(this.signUpForm.controls);

    }
}
