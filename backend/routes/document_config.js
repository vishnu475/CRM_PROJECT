import express from 'express';
import { DocumentService } from '../services/documentService.js';

export const documentTypesRouter = express.Router();
export const documentCategoriesRouter = express.Router();

// GET /api/document-types
documentTypesRouter.get('/', async (req, res) => {
  try {
    const data = await DocumentService.getDocumentTypes();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/document-types
documentTypesRouter.post('/', async (req, res) => {
  try {
    const result = await DocumentService.saveDocumentType(req.body, req.user);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/document-types/:id
documentTypesRouter.patch('/:id', async (req, res) => {
  try {
    const result = await DocumentService.saveDocumentType({ ...req.body, id: req.params.id }, req.user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/document-categories
documentCategoriesRouter.get('/', async (req, res) => {
  try {
    const data = await DocumentService.getCategories();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/document-categories
documentCategoriesRouter.post('/', async (req, res) => {
  try {
    const result = await DocumentService.saveCategory(req.body, req.user);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/document-categories/:id
documentCategoriesRouter.patch('/:id', async (req, res) => {
  try {
    const result = await DocumentService.saveCategory({ ...req.body, id: req.params.id }, req.user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});
