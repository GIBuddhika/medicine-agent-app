import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { AccountTypeConstants } from 'app/constants/account-types';
import { MyOrdersService } from 'app/services/my-orders.service';
import { UsersService } from 'app/services/users.service';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { OrderStatusConstants } from 'app/constants/order-statuses';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RuntimeEnvLoaderService } from 'app/services/runtime-env-loader.service';


@Component({
  selector: 'app-account-summary',
  templateUrl: './account-summary.component.html',
  styleUrls: ['./account-summary.component.scss']
})
export class AccountSummaryComponent implements OnInit {

  @ViewChild('viewOrderModal') viewOrderModal: ElementRef<HTMLElement>;

  orderSearchForm: FormGroup;
  accountType: number = 0;
  isAccountTypePersonalOnly = AccountTypeConstants.PERSONAL;
  isAccountTypeShopOnly = AccountTypeConstants.SHOP;
  isAccountTypeShopAndPersonal = AccountTypeConstants.SHOP_AND_PERSONAL;
  isPersonalOrdersOnly: boolean = false;

  shops = [];
  imagePath: string;
  accountSummary = {
    total_sale: null,
    total_refunds: null,
    orders: null,
    total: null,
  };
  dateFrom: {
    year, month, day
  };
  dateTo: {
    year, month, day
  };
  params = {
    shop_id: null,
    date_from: null,
    date_to: null,
    personal_only: false,
    page: null,
    perPage: null,
  }
  orders = [];
  isSearching: boolean = false;
  pageSize = 10;
  page = 1;
  totalCount: number = 0;
  selectedOrderItem = {
    id: null,
    order_id: null,
    dueMonthsCount: null,
    price: null,
    total_paid_amount: null,
    online_refunds: null,
    refundable_amount: null,
    payments: [],
    refunds: [],
  };

  modalRef: any;

  constructor(
    private envLoader: RuntimeEnvLoaderService,
    private formBuilder: FormBuilder,
    private usersService: UsersService,
    private myOrdersService: MyOrdersService,
    private modalService: NgbModal,
  ) {
    this.imagePath = this.envLoader.config.IMAGE_BASE_URL;
    this.accountType = parseInt(localStorage.getItem('account_type'));
    if (this.accountType == this.isAccountTypePersonalOnly) {
      this.isPersonalOrdersOnly = true;
    }
  }

  ngOnInit(): void {
    (async () => {
      if (!this.isPersonalOrdersOnly) {
        await this.getShops();
      }

      let today = new Date();
      this.dateFrom = {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: 1
      };
      this.dateTo = {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate()
      };

      this.filterOrders(this.page);
    })();

    this.orderSearchForm = this.formBuilder.group({
      shopId: new FormControl('', []),
    });
  }

  async getShops() {
    this.shops = await this.usersService.getShops().toPromise();
    if (this.shops.length == 0) {
      this.isPersonalOrdersOnly = true;
    }
  }

  async getAccountSummary(data) {
    this.accountSummary = await this.myOrdersService.getAccountSummary(data).toPromise();
    this.orders = this.accountSummary.orders;
    console.log(this.orders);
    this.processOrderData();
  }

  processOrderData() {
    this.orders.forEach(order => {
      let totalAmount = order.price * order.quantity;
      if (order.duration) {
        totalAmount = totalAmount * order.duration;
      }
      order.total_paid_amount = totalAmount;

      switch (order.status) {
        case OrderStatusConstants.PENDING:
          order.status_name = "Pending";
          break;
        case OrderStatusConstants.SUCCESS:
          order.status_name = "Not collected";
          break;
        case OrderStatusConstants.COLLECTED:
          order.status_name = "Collected";
          break;
        case OrderStatusConstants.RECEIVED:
          order.status_name = "Received";
          break;
        case OrderStatusConstants.CANCELLED:
          order.status_name = "Cancelled";
          break;
        default:
          break;
      }

      order.image_location = order.item.files.find(file => file.is_default == true).location;
      order.dueDate = this.setDueDate(order);
    });
  }

  setDueDate(orderItem) {
    let dueDate = null;
    if (orderItem.duration != null) {
      dueDate = moment(orderItem.created_at, "YYYY-MM-DD HH:mm:ss").add(orderItem.duration, 'months');
    }
    return dueDate;
  }

  async filterOrders(page = 1) {
    this.isSearching = true;

    this.params.personal_only = this.isPersonalOrdersOnly;

    let shopId = this.orderSearchForm?.controls?.shopId?.value;

    if (shopId) {
      this.params.shop_id = shopId;
    } else {
      this.params.shop_id = null;
    }

    if (!this.dateFrom || !this.dateTo) {
      Swal.fire(
        '',
        'Please select "Date from" and "Date to" before filter orders.',
        'warning'
      );
    }

    if (this.dateFrom) {
      this.params.date_from = this.dateFrom.year + "-" + ('0' + this.dateFrom.month).slice(-2) + "-" + ('0' + this.dateFrom.day).slice(-2);
    }
    if (this.dateTo) {
      this.params.date_to = this.dateTo.year + "-" + ('0' + this.dateTo.month).slice(-2) + "-" + ('0' + this.dateTo.day).slice(-2);
    }

    this.params.page = this.page;
    this.params.perPage = this.pageSize;

    await this.getAccountSummary(this.params);

    this.isSearching = false;
  }

  filterOnPaginate(page) {
    this.filterOrders(page);
  }

  async openViewOrderModal(contentView, orderItem) {
    this.selectedOrderItem = orderItem;

    console.log(this.selectedOrderItem);


    let paymentData = await this.myOrdersService.getItemPaymentData(this.selectedOrderItem.id).toPromise();
    console.log(paymentData);

    this.selectedOrderItem.payments = paymentData.payments;
    this.selectedOrderItem.refunds = paymentData.refunds;
    this.selectedOrderItem.total_paid_amount = paymentData.total_paid_amount;
    this.selectedOrderItem.online_refunds = paymentData.online_refunds;
    this.selectedOrderItem.refundable_amount = this.selectedOrderItem.total_paid_amount - this.selectedOrderItem.online_refunds;

    this.modalRef = this.modalService.open(contentView, { windowClass: 'custom-class' });
  }
}
