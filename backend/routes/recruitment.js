import express from 'express';
import { hrmsPool as pool } from '../db/pool.js'; // HRMS DB — Friend 2
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

// GET /api/recruitment/jobs - Fetch all job openings from PostgreSQL
router.get('/jobs', RecruitmentController.getJobOpenings);

// POST /api/recruitment/jobs - Add / Post new job opening to PostgreSQL
router.post('/jobs', RecruitmentController.addJobOpening);

// DELETE /api/recruitment/jobs/:id - Delete job opening from PostgreSQL
router.delete('/jobs/:id', RecruitmentController.deleteJobOpening);

// POST /api/recruitment/convert - Convert Hired Candidate to HRMS Employee using SQL Transaction
router.post('/convert', RecruitmentController.convertCandidateToEmployee);

export default router;

