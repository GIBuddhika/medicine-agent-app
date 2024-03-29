import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})

export class APIValidationMessagesHelper {

    formattedErrorMesssages = {
        duplicate: 'Already exists. Please try another.',
        invalid: 'Invalid format.',
        not_found: 'Not found.',
        required: 'Required.',
        must_be_confirmed: 'Should be equals to each other.',
        must_be_integer: 'Should be an integer.',
        must_be_url: 'Should be a valid url.',
    };

    showErrorMessages(errors, errorNamesForAPI = {}) {
        var errorHtml = "<ul>";
        for (let key in errors) {
            let name = key;
            if (errorNamesForAPI[key] != undefined) {
                name = errorNamesForAPI[key];
            }
            let errorMessages = errors[key];
            errorMessages.forEach(errorMessage => {
                errorHtml = errorHtml.concat("<li>" + this.capitalizeFirstLetter(name) + ": " + this.formattedErrorMesssages[errorMessage] + "</li>");
            });
        }
        return errorHtml;
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}
