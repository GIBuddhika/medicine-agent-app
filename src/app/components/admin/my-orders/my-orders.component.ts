import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MyOrdersService } from 'app/services/my-orders.service';
import { RuntimeEnvLoaderService } from 'app/services/runtime-env-loader.service';
import { ShopsService } from 'app/services/shops.service';
import { UsersService } from 'app/services/users.service';

@Component({
  selector: 'app-my-orders',
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss']
})
export class MyOrdersComponent implements OnInit {

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
  isSearching: boolean = false;
  isProductsListDisabled: boolean = true;
  products = [];
  selectedProduct: number;
  shops = [];
  orderItems = {
    order_items: [],
    users: [],
  };

  orderSearchForm: FormGroup;

  constructor(
    private envLoader: RuntimeEnvLoaderService,
    private myOrdersService: MyOrdersService,
    private formBuilder: FormBuilder,
    private usersService: UsersService,
    private shopsService: ShopsService,
  ) {
    this.imagePath = this.envLoader.config.IMAGE_BASE_URL;
  }

  ngOnInit(): void {
    this.getUnCollectedOrders({ status: 'not-collected' });
    this.getShops();
    this.orderSearchForm = this.formBuilder.group({
      orderNo: new FormControl('', []),
      shopId: new FormControl('', []),
      status: new FormControl('not-collected', []),
      phone: new FormControl('', []),
    });
  }

  async getShops() {
    this.shops = await this.usersService.getShops().toPromise();
    console.log(this.shops);
  }

  async getProducts(shopId) {
    this.products = await this.shopsService.getProductsByShop(shopId).toPromise();
    console.log(this.products);
  }

  async getUnCollectedOrders(params = {}) {
    this.orderItems = await this.myOrdersService.getMyUnCollectedShopOrdersAdmin(params).toPromise();
    Object.keys(this.orderItems.order_items).forEach(key => {
      let user = this.orderItems.users.find(user => user.id == key);
      console.log(user);

      user.orderItems = this.orderItems.order_items[key];
    });
  }

  async filterOrders() {
    this.isSearching = true;

    let params = {
      shop_id: null,
      order_id: null,
      product_id: this.selectedProduct,
      date: null,
      phone: null
    };

    let shopId = this.orderSearchForm.controls.shopId.value;
    let orderId = this.orderSearchForm.controls.orderNo.value;
    let phone = this.orderSearchForm.controls.phone.value;

    if (shopId) {
      params.shop_id = shopId;
    }
    if (orderId) {
      params.order_id = orderId;
    }
    if (this.date) {
      params.date = this.date.year + "-" + ('0' + this.date.month).slice(-2) + "-" + ('0' + this.date.day).slice(-2);
    }
    if (phone) {
      params.phone = phone;
    }

    if (this.orderSearchForm.controls.status.value == "not-collected") {
      //fetch un-colleted
      await this.getUnCollectedOrders(params);
    } else if (this.orderSearchForm.controls.status.value == "collected") {
      //fetch collected
    }

    this.isSearching = false;
  }

  onShopChange = async function () {
    this.products = [];
    this.selectedProduct = null;
    this.isProductsListDisabled = true;

    let selectedShopId = this.orderSearchForm.controls.shopId.value;

    if (selectedShopId) {
      await this.getProducts(this.orderSearchForm.controls.shopId.value);
      this.isProductsListDisabled = false;
    }

  }
}
