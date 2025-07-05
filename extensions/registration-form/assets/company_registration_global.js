console.log('i am everywhere');
let registrationLink = document.getElementById('registration-link');
let company = JSON.parse(localStorage.getItem('company'));
if(company){
    registrationLink.innerText = `Welcome ${company.name}`;
    registrationLink.href = '/';
}
