import { RecruitmentService } from '../services/recruitmentService.js';

export class RecruitmentController {
  static async getCandidates(req, res) {
    try {
      const candidates = await RecruitmentService.getCandidates();
      res.json({ success: true, data: candidates });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async addCandidate(req, res) {
    try {
      const candidate = await RecruitmentService.addCandidate(req.body);
      res.status(201).json({ success: true, data: candidate });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async updateCandidateStage(req, res) {
    const { id } = req.params;
    const { stage, notes, comment, performedBy } = req.body;
    try {
      const result = await RecruitmentService.updateCandidateStage(
        id,
        stage,
        notes || comment || null,
        performedBy || req.user?.name || 'HR Admin'
      );
      res.json({
        success: true,
        message: `Candidate stage updated to ${stage}`,
        employee: result.employee || null,
        candidate: result.candidate || null,
        data: result.employee || result.candidate || null
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async convertCandidateToEmployee(req, res) {
    const { candidateId, customDetails } = req.body;
    try {
      const result = await RecruitmentService.convertCandidateToEmployee({ candidateId, customDetails });
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getJobOpenings(req, res) {
    try {
      const jobs = await RecruitmentService.getJobOpenings();
      res.json({ success: true, data: jobs });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async addJobOpening(req, res) {
    try {
      const job = await RecruitmentService.addJobOpening(req.body);
      res.status(201).json({ success: true, data: job });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async deleteJobOpening(req, res) {
    try {
      const result = await RecruitmentService.deleteJobOpening(req.params.id);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

