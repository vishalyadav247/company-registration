import { Customer } from '../../models/customer/customerModel.js';
import { createZohoContact } from '../../services/zoho/contactCreation.js';

// Create a new customer
export const createCustomer = async (req, res) => {
  
  const { shop, name, address, gstNumber, mobileNumber, email } = req.body;

  try {
    const newCustomer = new Customer({ shop, name, address, gstNumber, mobileNumber, email });
    await newCustomer.save();
    let response = await createZohoContact({
      name,
      gstNumber,
      mobileNumber,
      email,
      address 
    });
    if(response.message === 'The contact has been added.') {
      let newCustomer = await Customer.findOneAndUpdate(
        { email: email },
        { zohoContactStatus: 'created' },
        { new: true }
      );
      return res.status(201).json({ message: 'Customer created successfully', customer: newCustomer });
    }
    res.status(201).json({ message: 'Customer created successfully', customer: newCustomer });
  } catch (error) {
    // Check for duplicate key errors (unique constraint violations)
    if (error.code === 11000) {
      return res.status(400).json({
        message: `Customer with this ${Object.keys(error.keyValue)[0]} already exists.`,
      });
    }

    // Handle other errors
    res.status(500).json({ message: 'error creating customer', error: error.message });
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
