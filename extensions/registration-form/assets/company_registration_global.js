console.log('i am everywhere');
let registrationLink = document.getElementById('registration-link');
let customer = JSON.parse(localStorage.getItem('customer'));
if(customer){
    registrationLink.innerText = `Welcome ${customer.name}`;
    registrationLink.href = '/';
}
