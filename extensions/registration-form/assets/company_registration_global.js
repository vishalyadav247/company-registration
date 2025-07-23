let registrationLink = document.getElementById('registration-link');
let customer = JSON.parse(localStorage.getItem('customer'));
if(customer){
    registrationLink.innerText = `Welcome ${customer.first_name}`;
    registrationLink.href = '/';
}
