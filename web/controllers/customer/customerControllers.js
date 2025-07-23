import { Customer } from '../../models/customer/customerModel.js';
import { createZohoContact } from '../../services/zoho/contactCreation.js';

// Create a new customer
export const createCustomer = async (req, res) => {

  const contact = req.body;

  try {

    const existingContact = await Customer.findOne({ email: contact.email })
    if (existingContact) {
      return res.status(400).json({ message: `Customer with ${contact.email} is already exists.` });
    }
    const response = await createZohoContact(contact);
    if (response.message === 'The contact has been added.') {
      const aditionProperties = {
        zohoContactStatus: 'created',
        customer_id: response.contact.contact_id
      }
      const newCustomer = new Customer({ ...contact, ...aditionProperties });
      await newCustomer.save();
      return res.status(201).json({ message: response.message, customer: newCustomer });
    }
  } catch (error) {
    res.status(400).json({ message: error.response.data.message });
  }
};

// Get all customers
export const getAllCustomers = async (req, res) => {
  try {
    const { shop } = req.query;
    const filter = shop ? { shop } : {};
    const customers = await Customer.find(filter).sort({ _id: -1 })
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
};
