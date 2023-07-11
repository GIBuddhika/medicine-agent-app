import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { AccountTypeConstants } from 'app/constants/account-types';
import { OrderStatusConstants } from 'app/constants/order-statuses';
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

  accountType: number = 0;
  isAccountTypePersonalOnly = AccountTypeConstants.PERSONAL;
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
  isPersonalOrdersOnly: boolean = false;
  isSearching: boolean = false;
  isProductsListDisabled: boolean = true;
  orderItems = {
    order_items: [],
    users: [],
  };
  products = [];
  selectedProduct: number;
  shops = [];

  orderSearchForm: FormGroup;

  constructor(
    private envLoader: RuntimeEnvLoaderService,
    private myOrdersService: MyOrdersService,
    private formBuilder: FormBuilder,
    private usersService: UsersService,
    private shopsService: ShopsService,
  ) {
    this.imagePath = this.envLoader.config.IMAGE_BASE_URL;
    this.accountType = parseInt(localStorage.getItem('account_type'));
    if (this.accountType == this.isAccountTypePersonalOnly) {
      this.isPersonalOrdersOnly = true;
    }
  }

  ngOnInit(): void {
    (async () => {
      if (this.isPersonalOrdersOnly) {
        this.getAllPersonalProducts();
        //get uncollected personal orders
        this.getPersonalOrders({ status: OrderStatusConstants.NOT_COLLECTED });
      } else {
        await this.getShops();
        this.getShopOrders({ status: OrderStatusConstants.NOT_COLLECTED });
      }
    })();

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

  async getAllPersonalProducts() {
    let personalProducts = await this.usersService.getAllPersonalProducts().toPromise();
    this.products = personalProducts.data;
    console.log(this.products);
  }

  async getShopOrders(params = {}) {
    this.orderItems = await this.myOrdersService.getMyShopOrdersAdmin(params).toPromise();
    Object.keys(this.orderItems.order_items).forEach(key => {
      let user = this.orderItems.users.find(user => user.id == key);
      user.orderItems = this.orderItems.order_items[key];
      user.orderItems.forEach(orderItem => {
        let shop = this.shops.find(shop => shop.id == orderItem.shop_id);
        orderItem.shop_name_address = shop.name + ", " + shop.city.name;
      });
    });
  }

  async getPersonalOrders(params = {}) {
    this.orderItems = await this.myOrdersService.getMyPersonalOrdersAdmin(params).toPromise();
    console.log(this.orderItems);

    Object.keys(this.orderItems.order_items).forEach(key => {
      let user = this.orderItems.users.find(user => user.id == key);
      user.orderItems = this.orderItems.order_items[key];
      // user.orderItems.forEach(orderItem => {
      //   let shop = this.shops.find(shop => shop.id == orderItem.shop_id);
      //   orderItem.shop_name_address = shop.name + ", " + shop.city.name;
      // });
    });
  }

  async filterOrders() {
    this.isSearching = true;

    let params = {
      shop_id: null,
      order_id: null,
      product_id: this.selectedProduct,
      date: null,
      phone: null,
      status: null,
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
      params.status = OrderStatusConstants.NOT_COLLECTED;
    } else if (this.orderSearchForm.controls.status.value == "collected") {
      params.status = OrderStatusConstants.COLLECTED;
    }

    if (this.isPersonalOrdersOnly) {
      await this.getPersonalOrders(params);
    } else {
      await this.getShopOrders(params);
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

  fetchPersonalItems() {
    if (this.isPersonalOrdersOnly) {
      this.getAllPersonalProducts();
    }
  }
}
