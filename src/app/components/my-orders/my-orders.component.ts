import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MyOrdersService } from 'app/services/my-orders.service';
import { OrdersService } from 'app/services/orders.service';
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
  @ViewChild('openPaymentModalId') openPaymentModalId: ElementRef<HTMLElement>;

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
  orderSearchForm: FormGroup;
  selectedOrderItem = {
    item_id: null,
    order_id: null,
    order_created_at: null,
    duration: null
  };
  stripe: any;

  constructor(
    private envLoader: RuntimeEnvLoaderService,
    private myOrdersService: MyOrdersService,
    private formBuilder: FormBuilder,
    private modalService: NgbModal,
    private ordersService: OrdersService
  ) {
    this.imagePath = this.envLoader.config.IMAGE_BASE_URL;
  }

  ngOnInit(): void {
    this.getMyUnCollectedOrders();
    this.orderSearchForm = this.formBuilder.group({
      orderStatus: new FormControl('un-collected', []),
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
    this.orderItems = await this.myOrdersService.getMyUnCollectedOrders().toPromise();
    this.processOrderData();
  }

  async getMyCollectedOrders() {
    this.orderItems = await this.myOrdersService.getMyCollectedOrders().toPromise();
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

  fetchOrders() {
    switch (this.orderSearchForm.controls.orderStatus.value) {
      case 'collected':
        this.getMyCollectedOrders();
        break;
      case 'un-collected':
        this.getMyUnCollectedOrders();
        break;

      default:
        break;
    }
  }

  openOrderItemRenewModal(contentReceived, orderItem) {
    this.selectedOrderItem = orderItem;
    this.modalRef = this.modalService.open(contentReceived, { windowClass: 'custom-class' });
    this.duration = 1;
    this.setNewDueDate();
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
}
