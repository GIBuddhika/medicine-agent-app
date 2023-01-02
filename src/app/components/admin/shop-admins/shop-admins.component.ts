import { Component, OnInit, OnDestroy, ViewChild, ViewEncapsulation, ElementRef, AfterViewInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Observable, merge, pipe } from 'rxjs';
import { take, debounceTime, distinctUntilChanged, filter, map, takeUntil, finalize, isEmpty } from 'rxjs/operators';
import { NgbModal, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { AgmMap } from '@agm/core';
import { MouseEvent as AGMMouseEvent } from '@agm/core';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import Swal from 'sweetalert2'

import { APIValidationMessagesHelper } from '../../../helpers/api-validation-messages.helper';
import { MetaService } from '../../../services/meta.service';
import { RuntimeEnvLoaderService } from '../../../services/runtime-env-loader.service';
import { UsersService } from '../../../services/users.service';
import { ValidationMessagesHelper } from '../../../helpers/validation-messages.helper';
import { PhoneValidator } from 'app/validators/phone.validator';
import { ShopAdminsService } from 'app/services/shop-admins.service';

@Component({
  selector: 'app-shop-admins',
  templateUrl: './shop-admins.component.html',
  styleUrls: ['./shop-admins.component.scss']
})
export class ShopAdminsComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$: Subject<any> = new Subject();
  @ViewChild('openCreateModalId') openCreateModalId: ElementRef<HTMLElement>;

  croppedImage: any;
  errorMessages: string = null;
  imagePath: string;
  isCreatingProcess: boolean = true;
  isLoading: boolean = true;
  isSubmitted: boolean = false;
  isSubmitting: boolean = false;
  isUpdating: boolean = false;
  modalRef: any;
  selectedShop: any;
  selectedShopsList: any = [];
  shopAdminForm: FormGroup;
  shopAdmins: any = [];
  shops: any = [];
  shopsOriginal: any = [];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private usersService: UsersService,
    private modalService: NgbModal,
    private metaService: MetaService,
    private shopAdminsService: ShopAdminsService,
    private validationMessagesHelper: ValidationMessagesHelper,
    private APIValidationMessagesHelper: APIValidationMessagesHelper,
    private envLoader: RuntimeEnvLoaderService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.imagePath = this.envLoader.config.IMAGE_BASE_URL;
  }

  ngOnInit() {
    let currentUrl = this.router.url;
    this.getMainData();
  }

  ngAfterViewInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      if (params['action'] == "add") {
        let el: HTMLElement = this.openCreateModalId.nativeElement;
        el.click();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getMainData() {
    this.shopAdminsService.getAll()
      .pipe(take(1))
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe(response => {
        this.shopAdmins = response;
      });
    this.usersService.getShops()
      .pipe(take(1))
      .subscribe(response => {
        this.shopsOriginal = response;
        // this.shops = response;
      });
  }

  openCreateModal(content) {
    this.errorMessages = null;
    this.isCreatingProcess = true;
    this.croppedImage = null;
    this.shops = this.shopsOriginal;
    this.shopAdminForm = this.formBuilder.group({
      name: new FormControl('', [Validators.required]),
      phone: new FormControl('', [Validators.required, PhoneValidator]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
      confirmPassword: new FormControl('', [Validators.required]),
    }, {
      validator: this.checkPasswords
    });
    this.modalRef = this.modalService.open(content, { windowClass: 'custom-class' });
  }

  checkPasswords(group: FormGroup) {
    let pass = group.get('password').value;
    let confirmPass = group.get('confirmPassword').value;
    if (pass && confirmPass) {
      return pass === confirmPass ? null : { notSame: true }
    }
  }

  openEditModal(content, shopAdmin) {
    this.errorMessages = null;
    this.isCreatingProcess = false;
    this.isSubmitted = false;
    this.shopAdminForm = this.formBuilder.group({
      id: new FormControl(shopAdmin.id, []),
      name: new FormControl(shopAdmin.name, [Validators.required]),
      phone: new FormControl(shopAdmin.phone, [Validators.required, PhoneValidator]),
      email: new FormControl(shopAdmin.email, [Validators.required, Validators.email]),
      password: new FormControl('', []),
      confirmPassword: new FormControl('', []),
    }, {
      validator: this.checkPasswords
    });

    this.selectedShopsList = shopAdmin.shops;
    let shopIds = this.selectedShopsList.map(shop => shop.id);
    this.shops = this.shopsOriginal.filter(shop => {
      return !shopIds.includes(shop.id);
    });

    this.modalRef = this.modalService.open(content, { windowClass: 'custom-class' });
  }

  createShopAdmin() {
    this.errorMessages = null;
    this.isSubmitted = true;
    var hasError = false;
    if (!this.shopAdminForm.valid) {
      hasError = true;
      return false;
    }

    this.isSubmitting = true;
    var data = {
      name: this.shopAdminForm.controls.name.value,
      phone: this.shopAdminForm.controls.phone.value,
      email: this.shopAdminForm.controls.email.value,
      password: this.shopAdminForm.controls.password.value,
      confirmPassword: this.shopAdminForm.controls.confirmPassword.value,
      shop_ids: JSON.stringify(this.selectedShopsList.map(({ id }) => id)),
    };

    this.shopAdminsService.create(data)
      .pipe(take(1))
      .pipe(finalize(() => {
        this.isSubmitting = false;
      }))
      .subscribe(response => {
        Swal.fire(
          'Success',
          'New shop admin created.',
          'success'
        );
        this.modalRef.close();
        this.getMainData();
      }, error => {
        if (error.code == 400) {
          this.errorMessages = this.APIValidationMessagesHelper.showErrorMessages(error.errors);
          this.scrollToTop();
        } else {
          Swal.fire(
            'Sorry',
            'Something went wrong, Please try again.',
            'error'
          );
          this.modalRef.close();
        }
      });
  }


  scrollToTop() {
    var main = document.getElementsByClassName("custom-class")[0];
    main.getElementsByClassName("modal-header")[0].scrollIntoView({ behavior: 'smooth' });
  }

  updateShopAdmin() {
    this.errorMessages = null;
    this.isSubmitted = true;
    var hasError = false;
    if (!this.shopAdminForm.valid) {
      this.scrollToTop();
      hasError = true;
    }

    this.isUpdating = true;
    var data = {
      name: this.shopAdminForm.controls.name.value,
      phone: this.shopAdminForm.controls.phone.value,
      email: this.shopAdminForm.controls.email.value,
      password: this.shopAdminForm.controls.password.value,
      confirmPassword: this.shopAdminForm.controls.confirmPassword.value,
      shop_ids: JSON.stringify(this.selectedShopsList.map(({ id }) => id)),
    };

    this.shopAdminsService.update(this.shopAdminForm.controls.id.value, data)
      .pipe(finalize(() => {
        this.isUpdating = false;
      }))
      .pipe(take(1))
      .subscribe(response => {
        Swal.fire(
          'Success',
          'Shop admin updated.',
          'success'
        );
        this.modalService.dismissAll();
        this.getMainData();
      }, error => {
        if (error.code == 400) {
          this.errorMessages = this.APIValidationMessagesHelper.showErrorMessages(error.errors);
          this.scrollToTop();
        } else {
          Swal.fire(
            'Sorry',
            'Something went wrong, Please try again.',
            'error'
          );
          this.modalRef.close();
        }
      });
  }

  deleteShopAdmin(shopAdminId) {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will delete the shop admin.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      reverseButtons: true,
      focusCancel: true
    }).then((result) => {
      if (result.value) {
        this.shopAdminsService.delete(shopAdminId)
          .subscribe(response => {
            this.getMainData();
            Swal.fire(
              'Deleted!',
              'Shop admin has been deleted.',
              'success'
            );
          }, error => {
            Swal.fire(
              'Error!',
              'Something went wrong. Please try again.',
              'error'
            );
          });
      }
    })
  }

  assignShop() {
    console.log(this.selectedShop == "");
    if (this.selectedShop != "") {
      let selectedShopData = this.shops.find(shop => shop.id == this.selectedShop);
      this.shops = this.shops.filter(shop => shop.id != this.selectedShop);
      this.selectedShopsList.push(selectedShopData);
      this.selectedShop = "";
    }
  }

  unAssignShop(shopId) {
    let selectedShopData = this.selectedShopsList.find(shop => shop.id == shopId);
    this.selectedShopsList = this.selectedShopsList.filter(shop => shop.id != shopId);
    this.shops.push(selectedShopData);
    this.selectedShop = "";
  }
}

