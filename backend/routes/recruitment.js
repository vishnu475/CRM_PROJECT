import express from 'express';
import { RecruitmentController } from '../controllers/recruitmentController.js';

const router = express.Router();

// GET /api/recruitment/candidates - Fetch all candidates from PostgreSQL
router.get('/candidates', RecruitmentController.getCandidates);

// POST /api/recruitment/candidates - Add new candidate to PostgreSQL
router.post('/candidates', RecruitmentController.addCandidate);

// PATCH, PUT & POST /api/recruitment/candidates/:id/stage - Update candidate stage in PostgreSQL
router.patch('/candidates/:id/stage', RecruitmentController.updateCandidateStage);
router.put('/candidates/:id/stage', RecruitmentController.updateCandidateStage);
router.post('/candidates/:id/stage', RecruitmentController.updateCandidateStage);
router.patch('/candidates/:id', RecruitmentController.updateCandidateStage);
router.put('/candidates/:id', RecruitmentController.updateCandidateStage);

// POST /api/recruitment/convert - Convert Hired Candidate to HRMS Employee using SQL Transaction
router.post('/convert', RecruitmentController.convertCandidateToEmployee);

export default router;
