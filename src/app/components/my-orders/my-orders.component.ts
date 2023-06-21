import { Component, OnInit } from '@angular/core';
import { MyOrdersService } from 'app/services/my-orders.service';
import { RuntimeEnvLoaderService } from 'app/services/runtime-env-loader.service';

@Component({
  selector: 'app-my-orders',
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss']
})
export class MyOrdersComponent implements OnInit {

  imagePath: string;
  unCollectedOrderItems = {
    unCollectedPersonalOrderItems: [],
    unColletedShopOrderItems: [],
    users: [],
    shops: []
  };

  constructor(
    private envLoader: RuntimeEnvLoaderService,
    private myOrdersService: MyOrdersService,
  ) {
    this.imagePath = this.envLoader.config.IMAGE_BASE_URL;
  }

  ngOnInit(): void {
    this.getMyOrders();
  }

  async getMyOrders() {
    this.unCollectedOrderItems = await this.myOrdersService.getMyOrders().toPromise();

    Object.keys(this.unCollectedOrderItems.unCollectedPersonalOrderItems).forEach(key => {
      let user = this.unCollectedOrderItems.users.find(user => user.id == key);
      user.orderItems = this.unCollectedOrderItems.unCollectedPersonalOrderItems[key];
    });
    Object.keys(this.unCollectedOrderItems.unColletedShopOrderItems).forEach(key => {
      let shop = this.unCollectedOrderItems.shops.find(shop => shop.id == key);
      shop.orderItems = this.unCollectedOrderItems.unColletedShopOrderItems[key];
    });
  }

}
