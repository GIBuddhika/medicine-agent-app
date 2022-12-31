import { AbstractControl } from '@angular/forms';
export function PhoneValidator(
    control: AbstractControl
): { [key: string]: boolean } | null {
    let value = control.value;

    let regexp = new RegExp('^[0-9]*$');
    if (!regexp.test(value)) {
        return { pattern: false };
    }

    if (value.length != 9) {
        return { pattern: false };
    }

    if (!['70', '71', '72', '74', '75', '76', '77', '77'].includes(value.substring(0, 2))) {
        return { pattern: false };
    }
    return null;
}