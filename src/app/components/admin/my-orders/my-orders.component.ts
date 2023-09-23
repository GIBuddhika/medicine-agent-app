import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AccountTypeConstants } from 'app/constants/account-types';
import { OrderStatusConstants } from 'app/constants/order-statuses';
import { MyOrdersService } from 'app/services/my-orders.service';
import { RuntimeEnvLoaderService } from 'app/services/runtime-env-loader.service';
import { ShopsService } from 'app/services/shops.service';
import { UsersService } from 'app/services/users.service';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-my-orders',
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss']
})
export class MyOrdersComponent implements OnInit {
  @ViewChild('updateOrderModal') updateOrderModal: ElementRef<HTMLElement>;
  @ViewChild('cancelOrderModal') cancelOrderModal: ElementRef<HTMLElement>;
  @ViewChild('receiveOrderModal') receiveOrderModal: ElementRef<HTMLElement>;
  @ViewChild('refundOrderModal') refundOrderModal: ElementRef<HTMLElement>;

  accountType: number = 0;
  isAccountTypePersonalOnly = AccountTypeConstants.PERSONAL;
  isAccountTypeShopOnly = AccountTypeConstants.SHOP;
  isAccountTypeShopAndPersonal = AccountTypeConstants.SHOP_AND_PERSONAL;
  chargedAmount: number;
  chargeStatus: string = "charge";
  collectedOrderItems = {
    collectedPersonalOrderItems: [],
    colletedShopOrderItems: [],
    users: [],
    shops: []
  };
  date: {
    year, month, day
  };
  imagePath: string;
  isCancelling: boolean = false;
  isInvalidRefundAmount: boolean = false;
  isMarkAsCollectedProcessing: boolean = false;
  isMarkAsReceivedProcessing: boolean = false;
  isPersonalOrdersOnly: boolean = false;
  isRefunding: boolean = false;
  isSearching: boolean = false;
  isProductsListDisabled: boolean = false;
  modalRef: any;
  orderItemNote: string = "";
  orderItems = [];
  params = {
    shop_id: null,
    order_id: null,
    product_id: null,
    date: null,
    phone: null,
    status: null,
    is_personal_orders_only: null,
    page: null,
    per_page: null,
  }

  page: number = 1;
  perPage: number = 10;
  totalCount: number;

  products = [];
  refundAmount: number = 0;
  selectedOrderItem = {
    id: null,
    order_id: null,
    dueMonthsCount: null,
    price: null,
    total_paid_amount: null,
    online_refunds: null,
    refundable_amount: null,
  };
  selectedProduct: number;
  shops = [];

  orderSearchForm: FormGroup;

  constructor(
    private envLoader: RuntimeEnvLoaderService,
    private myOrdersService: MyOrdersService,
    private formBuilder: FormBuilder,
    private usersService: UsersService,
    private shopsService: ShopsService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.imagePath = this.envLoader.config.IMAGE_BASE_URL;
    this.accountType = parseInt(localStorage.getItem('account_type'));
    if (this.accountType == this.isAccountTypePersonalOnly) {
      this.isPersonalOrdersOnly = true;
    }
  }

  ngOnInit(): void {
    (async () => {
      this.route.queryParams.subscribe(async params => {
        this.params.shop_id = params['shop_id'];
        this.params.order_id = params['order_id'];
        this.params.product_id = params['product_id'];
        this.params.is_personal_orders_only = params['is_personal_orders_only'];
        this.params.phone = params['phone'];
        this.params.date = params['date'];
        this.params.page = params['page'] ?? this.page;
        this.params.per_page = params['per_page'] ?? this.perPage;
        this.params.status = params['status'] ?? null;

        this.page = this.params.page;

        await this.getShops();

        if (this.params.is_personal_orders_only == "true") {
          this.isPersonalOrdersOnly = true;
          await this.getAllPersonalProducts();
          this.selectedProduct = parseInt(this.params.product_id);
        } else {
          if (this.params.shop_id) {
            await this.getProducts(this.params.shop_id);
            this.selectedProduct = parseInt(this.params.product_id);
          }
        }

        if (this.params.shop_id == null && this.params.product_id == null) {
          this.isProductsListDisabled = true;
        }

        this.getOrders();
      });

      this.orderSearchForm = this.formBuilder.group({
        orderNo: new FormControl(this.params.order_id, []),
        shopId: new FormControl(this.params.shop_id, []),
        status: new FormControl(this.params.status ?? "", []),
        phone: new FormControl(this.params.phone, []),
      });
    })();

  }

  async getOrders() {
    let orderItemsResponse = await this.myOrdersService.getMyOrdersAdmin(this.params).toPromise();
    this.orderItems = orderItemsResponse.order_items;
    this.totalCount = orderItemsResponse.total;

    this.orderItems.forEach(orderItem => {
      orderItem.dueDate = this.setDueDate(orderItem);
    });

  }

  async getShops() {
    this.shops = await this.usersService.getShops().toPromise();
  }

  async getProducts(shopId) {
    this.products = await this.shopsService.getProductsByShop(shopId).toPromise();
  }

  async getAllPersonalProducts() {
    let personalProducts = await this.usersService.getAllPersonalProducts().toPromise();
    this.products = personalProducts.data;
  }

  setDueDate(orderItem) {
    let dueDate = null;
    if (orderItem.duration != null) {
      dueDate = moment(orderItem.order_created_at, "YYYY-MM-DD HH:mm:ss").add(orderItem.duration, 'months');
    }
    return dueDate;
  }

  async filterOrders() {

    let shopId = this.orderSearchForm.controls.shopId.value;
    let orderId = this.orderSearchForm.controls.orderNo.value;
    let phone = this.orderSearchForm.controls.phone.value;

    this.params.shop_id = shopId;
    this.params.order_id = orderId;
    this.params.phone = phone;

    if (this.params.shop_id && this.selectedProduct) {
      this.params.product_id = this.selectedProduct;
    } else if (this.isPersonalOrdersOnly && this.selectedProduct) {
      this.params.product_id = this.selectedProduct;
    } else {
      this.params.product_id = null;
    }

    if (this.isPersonalOrdersOnly) {
      this.params.is_personal_orders_only = true;
    } else {
      this.params.is_personal_orders_only = false;
    }

    if (this.date) {
      this.params.date = this.date.year + "-" + ('0' + this.date.month).slice(-2) + "-" + ('0' + this.date.day).slice(-2);
    }

    this.params.page = 1;
    this.params.per_page = this.perPage;

    this.params.status = this.orderSearchForm.controls.status.value == "" ? null : this.orderSearchForm.controls.status.value;

    this.router.navigate(['.'], { relativeTo: this.route, queryParams: this.params });
  }

  onShopChange = async function () {
    this.products = [];
    this.selectedProduct = null;

    let selectedShopId = this.orderSearchForm.controls.shopId.value;

    if (selectedShopId) {
      await this.getProducts(this.orderSearchForm.controls.shopId.value);
      this.isProductsListDisabled = false;
    }
  }

  fetchPersonalItems() {
    this.selectedProduct = null;
    this.isProductsListDisabled = true;
    this.orderSearchForm.get('shopId').setValue("");
    if (this.isPersonalOrdersOnly) {
      this.getAllPersonalProducts();
      this.selectedProduct = null;
      this.isProductsListDisabled = false;
    }
  }

  openUpdateOrderModal(content, orderItem) {
    this.isMarkAsCollectedProcessing = false;
    this.selectedOrderItem = orderItem;
    this.modalRef = this.modalService.open(content, { windowClass: 'custom-class' });
  }

  openCancelOrderModal(contentCancel, orderItem) {
    this.selectedOrderItem = orderItem;
    this.modalRef = this.modalService.open(contentCancel, { windowClass: 'custom-class' });
  }

  async openRefundOrderModal(contentRefund, orderItem) {
    this.selectedOrderItem = orderItem;

    let paymentData = await this.myOrdersService.getItemPaymentData(this.selectedOrderItem.id).toPromise();
    this.selectedOrderItem.total_paid_amount = paymentData.total_paid_amount;
    this.selectedOrderItem.online_refunds = paymentData.online_refunds;
    this.selectedOrderItem.refundable_amount = this.selectedOrderItem.total_paid_amount - this.selectedOrderItem.online_refunds;

    this.modalRef = this.modalService.open(contentRefund, { windowClass: 'custom-class' });
  }

  openOrderItemReceivedModal(contentReceived, orderItem) {
    this.selectedOrderItem = orderItem;
    this.modalRef = this.modalService.open(contentReceived, { windowClass: 'custom-class' });
    this.chargedAmount = this.selectedOrderItem.dueMonthsCount * this.selectedOrderItem.price;
  }

  async markOrderItemAsCollected() {
    this.isMarkAsCollectedProcessing = true;

    try {
      await this.myOrdersService.markAsCollected(this.selectedOrderItem.id, this.orderItemNote).toPromise();
      Swal.fire(
        'Success',
        'Order has marked as collected successfully.',
        'success'
      );
      window.location.reload();
    } catch (error) {
      Swal.fire(
        'Failed',
        'Something went wrong, Please try again.',
        'error'
      );
    } finally {
      this.isMarkAsCollectedProcessing = false;
      this.modalService.dismissAll();
    }
  }

  async markAsReceived() {
    this.isMarkAsReceivedProcessing = true;

    let data = {
      isChargedForDueItem: this.chargeStatus == "charge" ? true : false,
      chargedAmount: this.chargedAmount
    };

    try {
      await this.myOrdersService.markAsReceived(this.selectedOrderItem.id, data).toPromise();
      Swal.fire(
        'Success',
        'Order has marked as received successfully.',
        'success'
      );
      this.filterOrders();
    } catch (error) {
      Swal.fire(
        'Failed',
        'Something went wrong, Please try again.',
        'error'
      );
    } finally {
      this.isMarkAsReceivedProcessing = false;
      this.modalService.dismissAll();
    }
  }

  async cancelOrder() {
    this.isCancelling = true;
    try {
      await this.myOrdersService.cancel(this.selectedOrderItem.id, []).toPromise();

      this.orderSearchForm.get('status').setValue("not-collected");
      this.getOrders();

      this.isCancelling = false;
      this.modalRef.close();

      Swal.fire(
        'Success',
        'Order has been cancelled successfully.',
        'success'
      );
    } catch (error) {
      this.isCancelling = false;
      Swal.fire(
        'Something went wrong',
        'Please contact a support agent via 071-0125-874',
        'error'
      );
      this.modalRef.close();
    }
  }

  async refundOrder() {
    this.isInvalidRefundAmount = false;

    if (this.selectedOrderItem.refundable_amount == 0) {
      Swal.fire(
        'Warning',
        'Nothing to refund. You\'ve already refunded the fully amount.',
        'warning'
      );
      return false;
    }

    if (this.selectedOrderItem.refundable_amount > 0 && this.refundAmount == 0) {
      Swal.fire(
        'Warning',
        'Please add refund amount.',
        'warning'
      );
      return false;
    }

    if (this.refundAmount > 0 && this.selectedOrderItem.refundable_amount < this.refundAmount) {
      this.isInvalidRefundAmount = true;
      return false;
    }

    this.isRefunding = true;

    try {
      await this.myOrdersService.refund(this.selectedOrderItem.id, {
        amount: this.refundAmount
      }).toPromise();
      this.isRefunding = false;
      this.modalRef.close();

      Swal.fire(
        'Success',
        'Refund has been success.',
        'success'
      );
    } catch (error) {
      this.isRefunding = false;
      Swal.fire(
        'Something went wrong',
        'Please contact a support agent via 071-0125-874',
        'error'
      );
      // this.modalRef.close();
    }

  }

  onClickSearch(page = 1) {
    this.params.page = page;
    this.router.navigate(['.'], { relativeTo: this.route, queryParams: this.params });
  }

  onChangeProduct(product = null) {
    if (!product) {
      this.params.product_id = null;
    } else {
      this.selectedProduct = product.id;
    }
  }
}
