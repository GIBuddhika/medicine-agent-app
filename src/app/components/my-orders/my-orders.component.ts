import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MyOrdersService } from 'app/services/my-orders.service';
import { RuntimeEnvLoaderService } from 'app/services/runtime-env-loader.service';
import * as moment from 'moment';

@Component({
  selector: 'app-my-orders',
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss']
})
export class MyOrdersComponent implements OnInit {

  imagePath: string;
  orderItems = {
    personalOrderItems: [],
    shopOrderItems: [],
    users: [],
    shops: []
  };
  orderSearchForm: FormGroup;

  constructor(
    private envLoader: RuntimeEnvLoaderService,
    private myOrdersService: MyOrdersService,
    private formBuilder: FormBuilder,
  ) {
    this.imagePath = this.envLoader.config.IMAGE_BASE_URL;
  }

  ngOnInit(): void {
    this.getMyUnCollectedOrders();
    this.orderSearchForm = this.formBuilder.group({
      orderStatus: new FormControl('un-collected', []),
    });
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

}
