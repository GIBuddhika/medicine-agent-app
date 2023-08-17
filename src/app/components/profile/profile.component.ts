import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AccountTypeConstants } from 'app/constants/account-types';
import { UserRolesConstants } from 'app/constants/user-roles';
import { UsersService } from 'app/services/users.service';
import { PhoneValidator } from 'app/validators/phone.validator';
import { Subject } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})

export class ProfileComponent implements OnInit {
    private destroy$: Subject<void> = new Subject<void>();

    errorsList = [];
    isSubmitted: boolean = false;
    userProfileForm: FormGroup;
    submitting: boolean = false;

    focus;
    focus1;

    isAdmin: boolean = false;
    isCustomer: boolean = false;
    isShopAdmin: boolean = false;

    userPasswordForm: FormGroup;
    userProfileForm: FormGroup;
    phone: number;
    email: string;
    userData = {
        email: null,
        name: null,
        phone: null,
    };

    constructor(
        private formBuilder: FormBuilder,
        private usersService: UsersService,
    ) {
        if (localStorage.getItem('user_role') == UserRolesConstants.ADMIN.toString()) {
            this.isAdmin = true;
        } else if (localStorage.getItem('user_role') == UserRolesConstants.SHOP_ADMIN.toString()) {
            this.isShopAdmin = true;
        } else if (localStorage.getItem('user_role') == UserRolesConstants.CUSTOMER.toString()) {
            this.isCustomer = true;
        }

    }

    ngOnInit() {
        this.userProfileForm = this.formBuilder.group({
            name: new FormControl('', [Validators.required]),
            phone: new FormControl('', [Validators.required, PhoneValidator]),
            // bank: new FormControl('', [Validators.required]),
            // accountNumber: new FormControl('', [Validators.required]),
            // accountName: new FormControl('', [Validators.required]),
            password: new FormControl('', []),
            confirmPassword: new FormControl('', []),
        }, {
            validator: this.checkPasswords
        });

        this.userPasswordForm = this.formBuilder.group({
        });

        (async () => {
            this.getUserDetails();
        })();

    }

    async getUserDetails() {

        this.userData = await this.usersService.getCurrentUser().toPromise();

        this.email = this.userData.email;
        this.userProfileForm.controls.name.setValue(this.userData.name);
        this.userProfileForm.controls.phone.setValue(this.userData.phone);
    }

    checkPasswords(group: FormGroup) {
        let pass = group.get('password').value;
        let confirmPass = group.get('confirmPassword').value;
        return pass === confirmPass ? null : { notSame: true }
    }

    async onSubmit() {
        this.errorsList = [];
        this.isSubmitted = true;
        if (!this.userProfileForm.valid) {
            console.log(this.userProfileForm);

            return false;
        }
        this.submitting = true;

        var submitData = {
            name: this.userProfileForm.controls.name.value,
            phone: this.userProfileForm.controls.phone.value,
            password: null,
            confirmPassword: null,
        };

        if (this.userProfileForm.controls.password.value && this.userProfileForm.controls.confirmPassword.value) {
            submitData.password = this.userProfileForm.controls.password.value;
            submitData.confirmPassword = this.userProfileForm.controls.confirmPassword.value;
        }

        try {
            await this.usersService.updateCurrentUser(submitData).toPromise();
            Swal.fire(
                'Success',
                'Profile updated.',
                'success'
            );
        } catch (error) {
            Swal.fire(
                'Something went wrong',
                'Profile update failed. Please try again.',
                'error'
            );
        } finally {
            this.submitting = false;
        }
    }

}
