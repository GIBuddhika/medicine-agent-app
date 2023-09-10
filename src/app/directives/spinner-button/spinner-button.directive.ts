import { Directive, Input } from '@angular/core';
import { ElementRef } from '@angular/core';

@Directive({
  selector: '[spinnerButton]'
})
export class SpinnerButtonDirective {
  @Input('spinnerButton') isWaiting: boolean;
  @Input('replaceText') replaceText: string;
  @Input('originalText') originalText: string;
  originalInnerHtml: string;
  constructor(private el: ElementRef) { }

  ngOnInit() {
    if (!this.originalText) {
      this.originalInnerHtml = this.el.nativeElement.innerHTML;
    }

    if (!this.replaceText) {
      this.replaceText = "Please Wait";
    }
  }

  ngOnChanges() {
    if (this.isWaiting) {
      this.el.nativeElement.innerHTML = '<span><i class="fa fa-spinner fa-spin"></i>&nbsp;' + this.replaceText + '...</span>';
    } else if (!this.isWaiting && this.originalText) {
      this.el.nativeElement.innerHTML = '<span>' + this.originalText + '</span>';
    } else {
      if (this.el.nativeElement.innerHTML == '<span><i class="fa fa-spinner fa-spin"></i>&nbsp;' + this.replaceText + '...</span>') {
        this.el.nativeElement.innerHTML = this.originalInnerHtml;
      }
    }
    this.el.nativeElement.disabled = this.isWaiting;
  }
}
