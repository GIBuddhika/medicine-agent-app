import { Injectable, Output, EventEmitter } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class updateCartCountService {

    @Output() updateCartCountData: EventEmitter<any> = new EventEmitter();

    updateCartCount() {        
        this.updateCartCountData.emit();
    }

}
