import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MyOrdersService } from 'app/services/my-orders.service';
import { OrdersService } from 'app/services/orders.service';
import { ReviewsService } from 'app/services/reviews.service';
import { RuntimeEnvLoaderService } from 'app/services/runtime-env-loader.service';
import * as moment from 'moment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-my-orders',
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss']
})
export class MyOrdersComponent implements OnInit {
  @ViewChild('receiveOrderModal') receiveOrderModal: ElementRef<HTMLElement>;
  @ViewChild('cancelOrderModal') cancelOrderModal: ElementRef<HTMLElement>;
  @ViewChild('openPaymentModalId') openPaymentModalId: ElementRef<HTMLElement>;
  @ViewChild('reviewOrderModal') reviewOrderModal: ElementRef<HTMLElement>;

  currentRate: number = 4;
  card: any;
  duration: number = 1;
  dueDate: string;
  elements: any;
  imagePath: string;
  isProcessing: boolean = false;
  modalRef: any;
  modalRefPayment: any;
  orderItems = {
    personalOrderItems: [],
    shopOrderItems: [],
    users: [],
    shops: []
  };
  params = {
    date_from: null,
    date_to: null,
    page: null,
    perPage: null,
    product_name: null
  }
  orderSearchForm: FormGroup;
  reviewForm: FormGroup;
  selectedOrderItem = {
    id: null,
    item_id: null,
    order_id: null,
    order_created_at: null,
    duration: null,
    review: null,
  };
  stripe: any;
  isSearching: boolean = false;
  isSubmitted: boolean = false;

  dateFrom: {
    year, month, day
  };
  dateTo: {
    year, month, day
  };

  constructor(
    private envLoader: RuntimeEnvLoaderService,
    private myOrdersService: MyOrdersService,
    private formBuilder: FormBuilder,
    private modalService: NgbModal,
    private ordersService: OrdersService,
    private reviewsService: ReviewsService
  ) {
    this.imagePath = this.envLoader.config.IMAGE_BASE_URL;
  }

  ngOnInit(): void {
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

    if (this.dateFrom) {
      this.params.date_from = this.dateFrom.year + "-" + ('0' + this.dateFrom.month).slice(-2) + "-" + ('0' + this.dateFrom.day).slice(-2);
    }
    if (this.dateTo) {
      this.params.date_to = this.dateTo.year + "-" + ('0' + this.dateTo.month).slice(-2) + "-" + ('0' + this.dateTo.day).slice(-2);
    }

    this.getMyUnCollectedOrders();
    this.orderSearchForm = this.formBuilder.group({
      orderStatus: new FormControl('un-collected', []),
      productName: new FormControl('', []),
    });
    this.stripe = Stripe(this.envLoader.config.STRIPE_PUBLIC_KEY);
    this.elements = this.stripe.elements();
    let style =
    {
      base: {
        color: '#32325d',
        lineHeight: '24px',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    };
    this.card = this.elements.create('card', { hidePostalCode: true, style: style });
  }

  async getMyUnCollectedOrders() {
    this.orderItems = await this.myOrdersService.getMyUnCollectedOrders(this.params).toPromise();
    this.processOrderData();
  }

  async getMyCollectedOrders() {
    this.orderItems = await this.myOrdersService.getMyCollectedOrders(this.params).toPromise();
    this.processOrderData();
  }

  async getMyCancelledOrders() {
    this.orderItems = await this.myOrdersService.getMyCancelledOrders(this.params).toPromise();
    this.processOrderData();
  }

  processOrderData() {
    Object.keys(this.orderItems.personalOrderItems).forEach(key => {
      let user = this.orderItems.users.find(user => user.id == key);
      user.orderItems = this.orderItems.personalOrderItems[key];
      user.orderItems.forEach(orderItem => {
        orderItem.dueDate = this.setDueDate(orderItem);
        orderItem.isDue = (orderItem.dueDate && orderItem.dueDate < moment()) ? true : false;
      });
    });
    Object.keys(this.orderItems.shopOrderItems).forEach(key => {
      let shop = this.orderItems.shops.find(shop => shop.id == key);
      shop.orderItems = this.orderItems.shopOrderItems[key];
      shop.orderItems.forEach(orderItem => {
        orderItem.dueDate = this.setDueDate(orderItem);
        orderItem.isDue = (orderItem.dueDate && orderItem.dueDate < moment()) ? true : false;
      });
    });
  }

  setDueDate(orderItem) {
    let dueDate = null;
    if (orderItem.duration != null) {
      dueDate = moment(orderItem.order_created_at, "YYYY-MM-DD HH:mm:ss").add(orderItem.duration, 'months');
    }
    return dueDate;
  }

  async fetchOrders() {
    this.isSearching = true;

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
    if (this.orderSearchForm.controls.productName.value) {
      this.params.product_name = this.orderSearchForm.controls.productName.value;
    }

    switch (this.orderSearchForm.controls.orderStatus.value) {
      case 'collected':
        await this.getMyCollectedOrders();
        break;
      case 'un-collected':
        await this.getMyUnCollectedOrders();
        break;
      case 'cancelled':
        await this.getMyCancelledOrders();
        break;

      default:
        break;
    }

    this.isSearching = false;
  }

  openOrderItemRenewModal(contentReceived, orderItem) {
    this.selectedOrderItem = orderItem;
    this.modalRef = this.modalService.open(contentReceived, { windowClass: 'custom-class' });
    this.duration = 1;
    this.setNewDueDate();
  }

  openOrderItemCancelModal(contentCancel, orderItem) {
    this.selectedOrderItem = orderItem;
    this.modalRef = this.modalService.open(contentCancel, { windowClass: 'custom-class' });
  }

  async openOrderItemReviewModal(contentReview, orderItem) {
    this.selectedOrderItem = orderItem;

    let reviews = await this.reviewsService.getAll({ item_order_id: orderItem.id }).toPromise();

    if (reviews.length == 0) {
      this.selectedOrderItem.review = null;
      this.reviewForm = this.formBuilder.group({
        rating: new FormControl('', [Validators.required]),
        comment: new FormControl('', []),
      });
    } else {
      this.selectedOrderItem.review = reviews[0];
      this.reviewForm = this.formBuilder.group({
        rating: new FormControl('', []),
        comment: new FormControl(this.selectedOrderItem.review?.comment, []),
      });
    }
    this.modalRef = this.modalService.open(contentReview, { windowClass: 'custom-class' });
  }

  increaseValueDuration() {
    if (this.duration < 24) {
      this.duration++;
      this.setNewDueDate();
    }
  }

  decreaseValueDuration() {
    if (this.duration == 1) {
      this.duration = 1;
    } else {
      this.duration--;
    }
    this.setNewDueDate();
  }

  setNewDueDate() {
    this.dueDate = moment(this.selectedOrderItem.order_created_at, "YYYY-MM-DD HH:mm:ss")
      .add((this.selectedOrderItem.duration + this.duration), 'months').toString();
  }

  openPaymentModal(content) {
    this.modalRefPayment = this.modalService.open(content, { windowClass: 'custom-class' });
    this.card.mount('#card-element');
  }

  async payNow() {
    this.isProcessing = true;
    this.card.name = "new name";
    this.card.address = "new address";

    let stripeResult = await this.stripe.createToken(this.card,
      {
        name: 'ishan',
        address: {
          'line1': '510 Townsend St',
          'postal_code': '98140',
          'city': 'San Francisco',
          'state': 'CA',
          'country': 'US',
        },
      });
    if (stripeResult.error) {
      // Inform the user if there was an error
      var errorElement = document.getElementById('card-errors');
      errorElement.textContent = stripeResult.error.message;
      this.isProcessing = false;
      return;
    }

    try {
      let order = await this.ordersService.extend({
        stripe_token: stripeResult.token.id,
        item_id: this.selectedOrderItem.item_id,
        order_id: this.selectedOrderItem.order_id,
        quantity: 1,
        duration: this.duration
      }).toPromise();

      this.orderSearchForm.get('orderStatus').setValue("collected");
      await this.getMyCollectedOrders();
      this.isProcessing = false;
      this.modalRef.close();
      this.modalRefPayment.close();


      Swal.fire(
        'Order extend success',
        'Your order has been extended successfully.',
        'success'
      );

      //close payment modal
      //close extend modal
      //refetch collected orders
    } catch (error) {
      this.isProcessing = false;
      Swal.fire(
        'Something went wrong',
        'Please contact a support agent via 071-0125-874',
        'error'
      );
      this.modalRef.close();
    }
  };

  async cancelOrder() {

    this.isProcessing = true;
    try {
      await this.ordersService.cancel(this.selectedOrderItem.order_id, this.selectedOrderItem.id).toPromise();

      this.orderSearchForm.get('orderStatus').setValue("not-collected");
      await this.getMyCancelledOrders();
      this.isProcessing = false;
      this.modalRef.close();

      Swal.fire(
        'Success',
        'Your order has been cancelled successfully.',
        'success'
      );
    } catch (error) {
      this.isProcessing = false;
      Swal.fire(
        'Something went wrong',
        'Please contact a support agent via 071-0125-874',
        'error'
      );
      this.modalRef.close();
    }
  }

  async submitReview() {
    this.isSubmitted = true;

    if (!this.reviewForm.valid) {
      return false;
    }

    this.isProcessing = true;

    if (this.selectedOrderItem.review) {
      this.updateReview();
    } else {
      this.createReview();
    }

  }

  createReview = async function () {
    let params = {
      item_order_id: this.selectedOrderItem.id,
      rating: this.reviewForm.controls.rating.value,
      comment: this.reviewForm.controls.comment.value
    };

    try {
      await this.reviewsService.create(params).toPromise();
      Swal.fire(
        'Success',
        'Your review has been submitted successfully.',
        'success'
      );
    } catch (error) {
      Swal.fire(
        'Something went wrong',
        'Please contact a support agent via 071-0125-874',
        'error'
      );
    } finally {
      this.modalRef.close();
      this.isProcessing = false;
    }
  }

  updateReview = async function () {
    let params = {
      item_order_id: this.selectedOrderItem.id,
      rating: this.reviewForm.controls.rating.value ? this.reviewForm.controls.rating.value : this.selectedOrderItem.review.rating,
      comment: this.reviewForm.controls.comment.value
    };

    try {
      await this.reviewsService.update(this.selectedOrderItem.review.id, params).toPromise();
      Swal.fire(
        'Success',
        'Your review has been updated successfully.',
        'success'
      );
    } catch (error) {
      Swal.fire(
        'Something went wrong',
        'Please contact a support agent via 071-0125-874',
        'error'
      );
    } finally {
      this.modalRef.close();
      this.isProcessing = false;
    }
  }

  async openOrderItemReviewClearModal() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action will remove your review.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then(async (result) => {
      if (result.value) {
        try {
          await this.reviewsService.delete(this.selectedOrderItem.review.id).toPromise();
          Swal.fire(
            'Deleted!',
            'Your review has been deleted',
            'success'
          );
        } catch (error) {
          Swal.fire(
            'Something went wrong',
            'Please contact a support agent via 071-0125-874',
            'error'
          )
        } finally {
          this.modalRef.close();
        }
      } else if (result.dismiss === Swal.DismissReason.cancel) {

      }
    })
  }

}
