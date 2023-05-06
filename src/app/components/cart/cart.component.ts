import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OrdersService } from 'app/services/orders.service';
import { ProductsService } from 'app/services/products.service';
import { RuntimeEnvLoaderService } from 'app/services/runtime-env-loader.service';
import { updateCartCountService } from 'app/shared-services/update-cart-count.service';

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
    console.log(this.products);


    this.products.forEach(product => {
      product.data = fetchedProducts.find(productOriginal => productOriginal.id == product.id);
      let priceDetails = this.setProductPriceData(product);
      product.priceInText = priceDetails.priceInText;
      product.price = priceDetails.price;
    });

    console.log(this.products);




    // this.products.forEach(cartProduct => {
    //   cartProduct.cart_quantity = products.find(product => product.id == cartProduct.id).quantity;
    //   cartProduct.price = this.setProductPriceText(cartProduct);
    // });
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

  increaseValue(product) {
    console.log(product);

    if (product.quantity > product.cart_quantity) {
      product.cart_quantity++;
    }
    localStorage.setItem("cart", JSON.stringify(this.products));
    this.calculateCartPrice();
  }

  decreaseValue(product) {
    if (product.quantity == 1) {
      product.cart_quantity = 1;
    } else {
      product.cart_quantity--;
      localStorage.setItem("cart", JSON.stringify(this.products));
      this.calculateCartPrice();
    }
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

  //   card.addEventListener('change',(event)=>{
  //   var displayError = document.getElementById('card-errors');
  //   if (event.error) {
  //     displayError.textContent = event.error.message;
  //   } else {
  //     displayError.textContent = '';
  //   }
  // });


  openPaymentModal(content) {
    this.modalRef = this.modalService.open(content, { windowClass: 'custom-class' });
    this.card.mount('#card-element');
  }

  pay() {
    this.isProcessing = true;
    this.stripe.createToken(this.card).then((result) => {
      console.log(result);

      if (result.error) {
        // Inform the user if there was an error
        var errorElement = document.getElementById('card-errors');
        errorElement.textContent = result.error.message;
      } else {
        // Send the token to your server
        // stripeTokenHandler(result.token);
        console.log(result);
        //pay
        let order = this.ordersService.create({
          'stripe_token': result.token.id,
        });
        console.log(order);

      }
    });



  };

}
