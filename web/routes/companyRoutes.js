import express from 'express';
import { createCompany, getAllCompanies, getCompanyById, updateCompany, deleteCompany, deleteCompanies } from '../controllers/companyControllers.js';

const companyRoutes = express.Router();

// POST: Create a new company
companyRoutes.post('/', createCompany);

// GET: Fetch all companies
companyRoutes.get('/', getAllCompanies);

// GET: Fetch a specific company by ID
companyRoutes.get('/:id', getCompanyById);

// PUT: Update a company by ID
companyRoutes.put('/:id', updateCompany);

// DELETE: Delete a company by ID
companyRoutes.delete('/:id', deleteCompany);

// DELETE: Delete multiple companies by IDs
companyRoutes.delete('/delete-many', deleteCompanies);

export default companyRoutes; // Ensure it's being exported properly
