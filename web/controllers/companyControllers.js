import {Company} from '../mongodb/model.js';
import { createZohoContact } from '../services/zoho/contactCreation.js';

// Create a new company
export const createCompany = async (req, res) => {
  
  const { shop, name, address, gstNumber, mobileNumber, email } = req.body;

  try {
    const newCompany = new Company({ shop, name, address, gstNumber, mobileNumber, email });
    await newCompany.save();
    let zohoResponse = await createZohoContact({
      name,
      gstNumber,
      mobileNumber,
      email,
      address
    });
    if(zohoResponse.message === 'The contact has been added.') {
      let newCompany = await Company.findOneAndUpdate(
        { email: email },
        { zohoContactStatus: 'created' },
        { new: true }
      );
      return res.status(201).json({ message: 'Company created successfully', company: newCompany });
    }
    res.status(201).json({ message: 'Company created successfully', company: newCompany });
  } catch (error) {
    // Check for duplicate key errors (unique constraint violations)
    if (error.code === 11000) {
      return res.status(400).json({
        message: `Company with this ${Object.keys(error.keyValue)[0]} already exists.`,
      });
    }

    // Handle other errors
    res.status(500).json({ message: 'error creating company', error: error.message });
  }
};

// Get all companies
export const getAllCompanies = async (req, res) => {
  try {
    const { shop } = req.query;
    const filter = shop ? { shop } : {};
    const companies = await Company.find(filter).sort({ _id: -1 })
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching companies', error: error.message });
  }
};

// Get a company by ID
export const getCompanyById = async (req, res) => {
  const { id } = req.params;

  try {
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching company', error: error.message });
  }
};

// Update a company by ID
export const updateCompany = async (req, res) => {
  const { id } = req.params;
  const { name, address, gstNumber, mobileNumber, email } = req.body;

  try {
    const updatedCompany = await Company.findByIdAndUpdate(id, { name, address, gstNumber, mobileNumber, email }, { new: true });
    if (!updatedCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.status(200).json({ message: 'Company updated successfully', company: updatedCompany });
  } catch (error) {
    res.status(500).json({ message: 'Error updating company', error: error.message });
  }
};

// Delete a company by ID
export const deleteCompany = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCompany = await Company.findByIdAndDelete(id);
    if (!deletedCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.status(200).json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting company', error: error.message });
  }
};

// Delete multiple companies by IDs
export const deleteCompanies = async (req, res) => {
  const { ids } = req.body;  // Expecting an array of company IDs

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Please provide an array of company IDs' });
  }

  try {
    // Perform bulk deletion using `deleteMany`
    const result = await Company.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No companies found to delete' });
    }

    // Return the success message
    res.status(200).json({ message: `${result.deletedCount} companies deleted successfully` });
  } catch (error) {
    console.error('Error deleting companies:', error);
    res.status(500).json({ message: 'Error deleting companies', error: error.message });
  }
};
