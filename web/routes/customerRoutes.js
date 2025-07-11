import express from 'express';
import { createCustomer,getAllCustomers } from '../controllers/customer/customerControllers.js';

const customerRoutes = express.Router();

// POST: Create a new company
customerRoutes.post('/', createCustomer);

// GET: Fetch all companies
customerRoutes.get('/', getAllCustomers);

export default customerRoutes;
