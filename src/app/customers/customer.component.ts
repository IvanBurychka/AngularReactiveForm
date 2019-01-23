import { Component, OnInit, OnChanges } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, AbstractControl, ValidatorFn, FormArray } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';

import { Customer } from './customer';
import { from } from 'rxjs';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit, OnChanges {
  customer: Customer = new Customer();
  customerForm: FormGroup;
  firstName = '';
  emailMessage: string;

  get addresses (): FormArray {
    return <FormArray>this.customerForm.get('addresses');
  }

  private validationMessages = {
    required: 'Please enter your email address.',
    email: 'Please enter a valid email address.',
  };

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.customerForm = this.fb.group({
      firstName: [{value: this.firstName, disabled: false}, [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      emailGroup: this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        comfirmEmail: ['', Validators.required]
      }, {validator: compareEmails}),
      phone: '',
      sendCatalog: true,
      notification: '',
      rating: [ null, ratingValidation(0, 5)],
      // addresses:  this.buildAddress()
      addresses: this.fb.array([ this.buildAddress() ])
    });

    this.customerForm.get('notification').valueChanges.subscribe(value => {
      this.setNotification(value);
    });

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(value => {
      this.setMessage(emailControl);
    });

    // this.customerForm = new FormGroup({
    //   firstName: this.firstName,
    //   lastName: new FormControl(),
    //   email: new FormControl(),
    //   sendCatalog: new FormControl(true)
    // });

    // this.customerForm.patchValue({
    //   firstName: 'this.firstName',
    //   lastName: 'new FormControl()'
    // });
  }

  ngOnChanges () {
    // console.log(this.customerForm);
  }

  buildAddress (): FormGroup {
    return this.fb.group({
      addressType: 'home',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: null
    });
  }

  addAddress (): void {
    this.addresses.push(this.buildAddress());
  }
  save() {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
    console.log(`Customer: ${JSON.stringify(this.customer)}`);
  }

  setMessage (c: AbstractControl): void {
    this.emailMessage = '';

    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessage = Object.keys(c.errors).map(
        key => this.emailMessage += this.validationMessages[key]).join(' ');
    }
  }

  setNotification(notifyVia: string): void {
    const phoneControl = this.customerForm.get('phone');

    switch (notifyVia) {
      case 'text': {
        phoneControl.setValidators(Validators.required);
        break;
      }
      case 'email': {
        phoneControl.clearValidators();
        break;
      }
    }

    // if (notifyVia === 'text') {
    //   phoneControl.setValidators(Validators.required);
    // } else {
    //   phoneControl.clearValidators();
    // }
    phoneControl.updateValueAndValidity();
  }

}

// function ratingValidation (c: AbstractControl): {[key: string]: boolean} | null {

//   if (c.value !== null && (isNaN(c.value) || c.value < 0 || c.value > 5)) {
//     return { 'range': true };
//   }
//   return null;
// }

function ratingValidation(min: number, max: number): ValidatorFn {

  return (c: AbstractControl): { [key: string]: boolean } | null => {

    if (c.value !== null && (isNaN(c.value) || c.value < min || c.value > max)) {
      return { 'range': true };
    }
    return null;
  };
}

function compareEmails (c: AbstractControl): {[key: string]: boolean} | null {
  const email = c.get('email');
  const comfirmEmail = c.get('comfirmEmail');

  if (email.pristine || comfirmEmail.pristine) {
    return null;
  }

  if (email.value === comfirmEmail.value) {
    return null;
  }
  return {'match': true};

}
