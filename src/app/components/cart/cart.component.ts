import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OrdersService } from 'app/services/orders.service';
import { ProductsService } from 'app/services/products.service';
import { RuntimeEnvLoaderService } from 'app/services/runtime-env-loader.service';
import { updateCartCountService } from 'app/shared-services/update-cart-count.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  @ViewChild('openPaymentModalId') openPaymentModalId: ElementRef<HTMLElement>;
  @ViewChild('openPaymentModalId2') openPaymentModalId2: ElementRef<HTMLElement>;

  cardCaptureReady = false
  imagePath: string;
  isProcessing: boolean = false;
  products: any = [];
  total: number = 0;
  modalRef: any;
  isLoggedInUser: boolean = false;
  stripe: any;
  card: any;
  elements: any;
  isLoaded: boolean = false;

  constructor(
    private envLoader: RuntimeEnvLoaderService,
    private modalService: NgbModal,
    private productsService: ProductsService,
    private updateCartCountService: updateCartCountService,
    private ordersService: OrdersService,
    private router: Router,
  ) {
    this.imagePath = this.envLoader.config.IMAGE_BASE_URL;
    if (localStorage.getItem('token')) {
      this.isLoggedInUser = true;
    }
  }

  ngOnInit(): void {
    this.getProducts();

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

  async getProducts() {
    this.products = localStorage.getItem("cart") ? JSON.parse(localStorage.getItem("cart")) : [];
    let productsSubscription = [];
    this.products.forEach(cartProduct => {
      console.log(cartProduct);
      productsSubscription.push(this.productsService.get(cartProduct.slug).toPromise());
    });
    let fetchedProducts = await Promise.all(productsSubscription);
    this.products.forEach(product => {
      product.data = fetchedProducts.find(productOriginal => productOriginal.id == product.id);
      let priceDetails = this.setProductPriceData(product);
      product.priceInText = priceDetails.priceInText;
      product.price = priceDetails.price;
    });
    this.calculateCartPrice();
    this.isLoaded = true;
  }

  setProductPriceData(product) {
    let price;
    let priceInText;
    if (product.data.sellable_item) {
      if (product.data.sellable_item.wholesale_minimum_quantity
        && product.data.sellable_item.wholesale_minimum_quantity <= product.quantity) {
        price = product.data.sellable_item.wholesale_price;
      } else {
        price = product.data.sellable_item.retail_price;
      }
      priceInText = "Rs. " + price;
    } else {
      price = product.data.rentable_item.price_per_month;
      priceInText = "Rs. " + price + ' Per month';
    }
    return {
      price: price,
      priceInText: priceInText
    };
  }

  calculateCartPrice() {
    this.total = 0;
    console.log(this.products);

    this.products.forEach(product => {
      let isSellable = product.data.sellable_item ? true : false;

      let price;
      if (isSellable) {
        if (product.data.sellable_item.wholesale_minimum_quantity && product.data.sellable_item.wholesale_minimum_quantity <= product.quantity) {
          price = product.data.sellable_item.wholesale_price;
        } else {
          price = product.data.sellable_item.retail_price;
        }
      } else {
        price = product.data.rentable_item.price_per_month * product.duration;
      }
      product.subTotal = parseFloat(price) * parseFloat(product.quantity);
      this.total += product.subTotal;
    });
  }

  removeProduct(product) {
    let cartWithoutCurrentProduct = this.products.filter(function (item) {
      return item.time !== product.time;
    });
    localStorage.setItem("cart", JSON.stringify(cartWithoutCurrentProduct));
    this.getProducts();
    this.updateCartCountService.updateCartCount();
  }

  editProduct(product, i) {
    this.router.navigateByUrl(`/products/${product.slug}?q=${product.quantity}${product.duration ? ('&d=' + product.duration + '&i=' + i) : ''}`);
  }

  openPaymentModal(content) {
    this.modalRef = this.modalService.open(content, { windowClass: 'custom-class' });
    this.card.mount('#card-element');
  }

  async pay() {
    this.isProcessing = true;
    let cartData = [];
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
      cartData = this.products.map(product => {
        return {
          item_id: product.id,
          quantity: product.quantity,
          duration: product.duration ?? null,
          note: product.note ?? null
        }
      })

      let order = await this.ordersService.create({
        'stripe_token': stripeResult.token.id,
        'data': cartData
      }).toPromise();

      this.isProcessing = false;
      this.modalRef.close()

      Swal.fire(
        'Order success',
        'Your order has been placed successfully. Collect your items in the stores.',
        'success'
      );

    } catch (error) {
      let isSwalShown = false;
      let validationErrors = Object.keys(error.errors);
      this.isProcessing = false;

      validationErrors.forEach(validationError => {
        if (validationError.search("data.*.quantity") != -1) {
          let itemIndex = validationError.substring(5, 6);
          let itemId = cartData[itemIndex].item_id;
          let item = this.products.find(product => product.id == itemId);
          Swal.fire(
            'Not enough items available for Product: ' + item.data.name,
            'Please update the quantity and try again.',
            'error'
          );
          isSwalShown = true;
        }
      });

      if (!isSwalShown) {
        this.isProcessing = false;
        Swal.fire(
          'Something went wrong',
          'Please contact a support agent via 071-0125-874',
          'error'
        );
      }

      this.modalRef.close();
    }
  };

}
