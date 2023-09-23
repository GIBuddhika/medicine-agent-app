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

    isSubmittedBanks: boolean = false;
    submittingBanks: boolean = false;
    paymentsForm: FormGroup;
    selectedBank: {
        id: number,
        name: string
    };
    banks = [
        { id: 1, name: 'HNB' },
        { id: 2, name: 'Sampath bank' }
    ];

    focus;
    focus1;

    isAdmin: boolean = false;
    isCustomer: boolean = false;
    isShopAdmin: boolean = false;

    phone: number;
    email: string;
    userData = {
        email: null,
        name: null,
        phone: null,
        user_meta: null
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
            password: new FormControl('', []),
            confirmPassword: new FormControl('', []),
        }, {
            validator: this.checkPasswords
        });

        this.paymentsForm = this.formBuilder.group({
            branch: new FormControl('', [Validators.required]),
            accountNumber: new FormControl('', [Validators.required, Validators.pattern("^[0-9]*$")]),
            accountName: new FormControl('', [Validators.required]),
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

        if (this.userData.user_meta.find(meta => meta.key == "bank")) {
            this.selectedBank = this.banks.find(bank => bank.name == this.userData.user_meta.find(meta => meta.key == "bank")?.value);
        }

        if (this.userData.user_meta.find(meta => meta.key == "branch")) {
            this.paymentsForm.controls.branch.setValue(this.userData.user_meta.find(meta => meta.key == "branch")?.value);
        }

        if (this.userData.user_meta.find(meta => meta.key == "account_number")) {
            this.paymentsForm.controls.accountNumber.setValue(this.userData.user_meta.find(meta => meta.key == "account_number")?.value);
        }

        if (this.userData.user_meta.find(meta => meta.key == "account_name")) {
            this.paymentsForm.controls.accountName.setValue(this.userData.user_meta.find(meta => meta.key == "account_name")?.value);
        }
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
            password_confirmation: null,
        };

        if (this.userProfileForm.controls.password.value && this.userProfileForm.controls.confirmPassword.value) {
            submitData.password = this.userProfileForm.controls.password.value;
            submitData.password_confirmation = this.userProfileForm.controls.confirmPassword.value;
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


    onChangeBank(bank) {
        if (bank != undefined) {
            this.selectedBank = bank;
        }
    }

    async onSubmitBanks() {
        this.errorsList = [];
        this.isSubmittedBanks = true;
        if (!this.paymentsForm.valid) {
            console.log(this.paymentsForm);

            return false;
        }
        this.submittingBanks = true;

        var submitData = {
            bank: this.selectedBank.name,
            branch: this.paymentsForm.controls.branch.value,
            account_number: this.paymentsForm.controls.accountNumber.value,
            account_name: this.paymentsForm.controls.accountName.value,
        };

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
            this.submittingBanks = false;
        }
    }

}
