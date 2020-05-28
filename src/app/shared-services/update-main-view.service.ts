import { Injectable, Output, EventEmitter } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class UpdateMainViewSharedService {

    @Output() updateMainViewData: EventEmitter<any> = new EventEmitter();

    updateMainView(data=null) {
        this.updateMainViewData.emit(data);
    }

}
