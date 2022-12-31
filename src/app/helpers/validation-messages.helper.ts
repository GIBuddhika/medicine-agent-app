import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})

export class ValidationMessagesHelper {
    /*
    Input `id` and `formControlName` should be equal.
    Custom error messages can set as data-error-{error-type}
        Ex: data-error-required="this is required field" data-error-email="this is email field" 

    For checkboxes, set `id` inside label.
        Ex: <label id="id"><input type="checkbox" formControlName="formControlName"> Sample checkbox 1</label>
    */

    showErrorMessages(form) {
        for (let i in form.controls) {
            const element = document.getElementById(i);
            const control = form.controls[i];

            /*start - remove previous errors from control*/
            var elements = document.getElementsByClassName("invalid-" + i);
            while (elements.length > 0) {
                elements[0].parentNode.removeChild(elements[0]);
            }
            if (element) {
                element.closest(".form-group").classList.remove("has-danger", "margin-b-0");
            }
            /*end - remove previous errors from control*/

            if (control.status == "INVALID" && element) {
                for (let error in control.errors) {
                    switch (error) {
                        case 'required':
                            let errorRequired = element.getAttribute('data-error-required');
                            errorRequired = errorRequired ? errorRequired : 'Required.';
                            this.showError(element, i, errorRequired);
                            break;

                        case 'email':
                            let errorEmail = element.getAttribute('data-error-email');
                            errorEmail = errorEmail ? errorEmail : 'Should be a valid email.';
                            this.showError(element, i, errorEmail);
                            break;

                        case 'minlength':
                            let errorMinLength = element.getAttribute('data-error-minlength');
                            errorMinLength = errorMinLength ? errorMinLength : 'Should be greater than ' + control.errors.minlength.requiredLength + ' characters.';
                            this.showError(element, i, errorMinLength);
                            break;

                        case 'pattern':
                            let errorPattern = element.getAttribute('data-error-pattern');
                            errorPattern = errorPattern ? errorPattern : 'Should be valid phone number. Ex: 71222333';
                            this.showError(element, i, errorPattern);
                        default:
                            break;
                    }
                }
            }
        }
    }

    private showError(element, id, errorText) {
        if (element) {
            element.parentNode.classList.add("has-danger", "margin-b-0");
        }
        element.insertAdjacentHTML('afterend', "<p class='invalid-input invalid-" + id + " form-control-feedback'>" + errorText + "</p>");
    }
}
