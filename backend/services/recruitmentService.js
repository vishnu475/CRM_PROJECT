import bcrypt from 'bcryptjs';
import { hrmsPool as pool } from '../db/pool.js'; // HRMS DB — Friend 2
import { getNextEmployeeSequence, syncEmployeeSequence } from '../utils/employeeIdGenerator.js';

export class RecruitmentService {
  /**
   * Fetch all candidates from PostgreSQL
   */
  static async getCandidates() {
    const query = `
      SELECT 
        id,
        candidate_no AS "candidateNo",
        name,
        email,
        phone,
        department,
        applied_position AS "appliedPosition",
        job_title AS "jobTitle",
        experience_years AS "experienceYears",
        recruiter,
        stage,
        status,
        score,
        applied_date AS "appliedDate",
        education,
        skills,
        notes,
        COALESCE(expected_salary, 1800000) AS "expectedSalary",
        employee_id AS "convertedEmployeeId",
        employee_id AS "employeeId",
        stage = 'Employee' AS "isConverted"
      FROM job_candidates 
      ORDER BY created_at DESC
    `;
    const res = await pool.query(query);
    return res.rows.map(row => ({
      ...row,
      skills: typeof row.skills === 'string' ? JSON.parse(row.skills) : (row.skills || [])
    }));
  }

  /**
   * Add a new candidate into PostgreSQL (job_candidates table)
   */
  static async addCandidate(candidateData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const seqRes = await client.query(
        `UPDATE number_sequences SET current_value = current_value + 1 WHERE id = 'seq-can' RETURNING current_value, prefix`
      );
      const nextVal = seqRes.rows[0]?.current_value || Math.floor(Math.random() * 900) + 100;
      const prefix = seqRes.rows[0]?.prefix || 'CAN-';
      const candidateNo = `${prefix}${String(nextVal).padStart(3, '0')}`;
      const candId = `can-${Date.now()}`;

      const insertQuery = `
        INSERT INTO job_candidates 
        (id, candidate_no, name, email, phone, department, applied_position, job_title, recruiter, stage, status, score, applied_date, education, experience_years, skills, expected_salary)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_DATE, $13, $14, $15, $16)
        RETURNING *
      `;

      const values = [
        candId,
        candidateNo,
        candidateData.name || 'New Applicant',
        candidateData.email || '',
        candidateData.phone || '',
        candidateData.department || 'Engineering',
        candidateData.appliedPosition || 'Senior Software Engineer',
        candidateData.appliedPosition || 'Senior Software Engineer',
        candidateData.recruiter || 'Priya Sharma',
        candidateData.stage || 'Applied',
        'ACTIVE',
        candidateData.score || 80,
        candidateData.education || '',
        candidateData.experienceYears || 3,
        JSON.stringify(candidateData.skills || ['React', 'TypeScript']),
        candidateData.expectedSalary || 1800000
      ];

      const res = await client.query(insertQuery, values);
      await client.query('COMMIT');

      const row = res.rows[0];
      return {
        id: row.id,
        candidateNo: row.candidate_no,
        name: row.name,
        email: row.email,
        phone: row.phone,
        department: row.department,
        appliedPosition: row.applied_position,
        recruiter: row.recruiter,
        stage: row.stage,
        status: row.status,
        score: row.score,
        expectedSalary: Number(row.expected_salary) || 1800000,
        appliedDate: row.applied_date,
        education: row.education,
        experienceYears: row.experience_years,
        skills: typeof row.skills === 'string' ? JSON.parse(row.skills) : (row.skills || [])
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Update candidate stage in PostgreSQL
   * When stage becomes 'Employee':
   * 1. Upsert into employees (status = 'Active')
   * 2. Upsert into employee_onboarding (stage = 'Joined', current_stage = 'JOINED')
   * 3. Use employee_id as unique key
   * 4. Commit transaction after both tables are updated
   * 5. Return created employee in response
   */
  static async updateCandidateStage(id, stage, notes = null, performedBy = 'HR Admin') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch candidate
      const candRes = await client.query(
        'SELECT * FROM job_candidates WHERE id = $1 OR candidate_no = $1 OR employee_id = $1',
        [id]
      );
      const candidate = candRes.rows[0];
      const oldStage = candidate ? candidate.stage : 'Applied';
      const candNo = candidate ? candidate.candidate_no : id;
      const candId = candidate ? candidate.id : id;

      // Update candidate stage and notes in job_candidates table
      const updateQuery = `
        UPDATE job_candidates 
        SET stage = $1, 
            notes = COALESCE($2, notes),
            updated_at = NOW() 
        WHERE id = $3 OR candidate_no = $3 OR employee_id = $3
        RETURNING *
      `;
      const res = await client.query(updateQuery, [stage, notes, candId]);
      const updatedCandidate = res.rows[0] || candidate;

      let createdEmployee = null;

      // Whenever stage becomes 'Employee' (or 'Hired')
      if (stage === 'Employee' || stage === 'Hired') {
        // 1. Determine unique employee_id
        let empId = candidate?.employee_id;
        let isExistingEmployee = false;

        if (empId && empId.startsWith('EMP-')) {
          const existingEmp = await client.query(
            'SELECT id, emp_code, email FROM employees WHERE id = $1 OR emp_code = $1',
            [empId]
          );
          if (existingEmp.rows.length > 0) {
            const otherCand = await client.query(
              'SELECT id FROM job_candidates WHERE employee_id = $1 AND id != $2 LIMIT 1',
              [empId, candId]
            );
            if (otherCand.rows.length === 0) {
              isExistingEmployee = true;
              empId = existingEmp.rows[0].emp_code || existingEmp.rows[0].id;
            }
          }
        }

        if (!isExistingEmployee) {
          const seqData = await getNextEmployeeSequence(client);
          empId = seqData.nextEmpCode;
          await syncEmployeeSequence(client, seqData.nextNumber);
        }

        let empEmail = candidate?.email;
        if (!empEmail) {
          empEmail = `${empId.toLowerCase()}@company.com`;
        } else {
          // Prevent email collision with existing employees
          const emailCheck = await client.query(
            'SELECT id FROM employees WHERE email = $1 AND id != $2',
            [empEmail, empId]
          );
          if (emailCheck.rows.length > 0) {
            const cleanName = (candidate?.name || 'emp').toLowerCase().replace(/[^a-z0-9]/g, '');
            const numPart = empId.replace(/[^0-9]/g, '');
            empEmail = `${cleanName}${numPart ? '.' + numPart : ''}@company.com`;
          }
        }

        const empName = candidate?.name || 'Converted Employee';
        const empDept = candidate?.department || 'Engineering';
        const empDesig = candidate?.applied_position || candidate?.job_title || 'Senior Software Engineer';
        const empPhone = candidate?.phone || '+91 98765 00000';
        const empManager = candidate?.recruiter || candidate?.hiring_manager || 'Sarah Jenkins';
        
        // ANNUAL SALARY IS THE SOURCE OF TRUTH
        const annualSalary = Number(candidate?.expected_salary || candidate?.annual_ctc || 400000);
        const monthlySalary = Math.round((annualSalary / 12) * 100) / 100;
        const basicSalary = Math.round((monthlySalary * 0.6) * 100) / 100;
        const allowances = Math.round((monthlySalary * 0.4) * 100) / 100;

        // Update candidate with employee_id and status = 'CONVERTED'
        await client.query(
          `UPDATE job_candidates SET employee_id = $1, status = 'CONVERTED', updated_at = NOW() WHERE id = $2 OR candidate_no = $2`,
          [empId, candId]
        );

        const defaultPin = '1234';
        const pinHash = await bcrypt.hash(defaultPin, 10);

        // 2. Upsert into employees table (status = 'Active')
        const empUpsert = await client.query(`
          INSERT INTO employees (
            id, emp_code, name, email, phone, department, designation, joining_date, status,
            annual_salary, annual_ctc, salary, basic_salary, allowances, reporting_manager_name,
            plain_pin, pin, pin_hash
          )
          VALUES ($1, $1, $2, $3, $4, $5, $6, CURRENT_DATE, 'Active', $7, $7, $8, $9, $10, $11, '1234', '1234', $12)
          ON CONFLICT (id) DO UPDATE SET
            emp_code = EXCLUDED.emp_code,
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            department = EXCLUDED.department,
            designation = EXCLUDED.designation,
            annual_salary = EXCLUDED.annual_salary,
            annual_ctc = EXCLUDED.annual_ctc,
            salary = EXCLUDED.salary,
            basic_salary = EXCLUDED.basic_salary,
            allowances = EXCLUDED.allowances,
            reporting_manager_name = EXCLUDED.reporting_manager_name,
            pin_hash = EXCLUDED.pin_hash,
            plain_pin = EXCLUDED.plain_pin,
            status = 'Active',
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `, [empId, empName, empEmail, empPhone, empDept, empDesig, annualSalary, monthlySalary, basicSalary, allowances, empManager, pinHash]);

        createdEmployee = empUpsert.rows[0];

        // 3. Upsert into employee_onboarding table (stage = 'Joined', current_stage = 'JOINED')
        await client.query(`
          INSERT INTO employee_onboarding (employee_id, current_stage, stage, joined_date, updated_at)
          VALUES ($1, 'JOINED', 'Joined', CURRENT_DATE, CURRENT_TIMESTAMP)
          ON CONFLICT (employee_id) DO UPDATE SET
            current_stage = 'JOINED',
            stage = 'Joined',
            updated_at = CURRENT_TIMESTAMP
        `, [empId]);

        // 4. Ensure supplementary tables exist (bank details, statutory, shift assignments)
        await client.query(`
          INSERT INTO employee_bank_details (id, employee_id, bank_name, account_number, ifsc_code) 
          VALUES ($1, $2, 'HDFC Bank', '98765432101', 'HDFC0001234')
          ON CONFLICT (id) DO NOTHING
        `, [`BANK-${empId}`, empId]);

        await client.query(`
          INSERT INTO employee_statutory (id, employee_id, pan_number, uan_number) 
          VALUES ($1, $2, 'ABCDE1234F', '100987654321')
          ON CONFLICT (id) DO NOTHING
        `, [`STAT-${empId}`, empId]);

        await client.query(`
          INSERT INTO employee_shift_assignments (employee_id, shift_id, effective_from)
          VALUES ($1, 'SHF-GEN', CURRENT_DATE)
          ON CONFLICT (employee_id, effective_from) DO NOTHING
        `, [empId]);
      }

      // Record activity logs with evaluation comments/notes
      await client.query(
        `INSERT INTO candidate_activity_logs (candidate_id, candidate_no, from_stage, to_stage, notes, reason, changed_by)
         VALUES ($1, $2, $3, $4, $5, $5, $6)`,
        [candId, candNo, oldStage, stage, notes || null, performedBy || 'HR Admin']
      );

      await client.query(
        `INSERT INTO activity_logs (module, entity, entity_id, action, old_value, new_value, performed_by)
         VALUES ('recruitment', 'job_candidate', $1, 'candidate_stage_updated', $2, $3, $4)`,
        [candNo || candId, oldStage, notes ? `${stage} (Evaluation: ${notes})` : stage, performedBy || 'HR Admin']
      );

      // Commit transaction
      await client.query('COMMIT');
      return {
        success: true,
        candidate: updatedCandidate,
        employee: createdEmployee
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Convert Candidate to Employee inside a SINGLE SQL TRANSACTION
   */
  static async convertCandidateToEmployee({ candidateId, customDetails = {} }) {
    if (!candidateId) {
      throw new Error('Candidate ID is required for conversion.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch Candidate
      const candRes = await client.query('SELECT * FROM job_candidates WHERE id = $1 OR candidate_no = $1', [candidateId]);
      const candidate = candRes.rows[0];
      const candNo = candidate?.candidate_no || candidateId;
      const candId = candidate?.id || candidateId;

      // 2. Check if candidate already has an employee record or assign next sequential ID
      let empCode;
      let existingEmp = null;
      if (customDetails.empCode && customDetails.empCode.startsWith('EMP-')) {
        empCode = customDetails.empCode;
      } else if (candidate?.employee_id && candidate.employee_id.startsWith('EMP-')) {
        const check = await client.query(
          'SELECT id, emp_code, email FROM employees WHERE id = $1 OR emp_code = $1',
          [candidate.employee_id]
        );
        if (check.rows.length > 0) {
          const other = await client.query(
            'SELECT id FROM job_candidates WHERE employee_id = $1 AND id != $2 LIMIT 1',
            [candidate.employee_id, candId]
          );
          if (other.rows.length === 0) {
            existingEmp = check.rows[0];
            empCode = existingEmp.emp_code || existingEmp.id;
          }
        }
      }

      if (!empCode) {
        const seqData = await getNextEmployeeSequence(client);
        empCode = seqData.nextEmpCode;
        await syncEmployeeSequence(client, seqData.nextNumber);
      }

      const defaultPin = customDetails.pin || '1234';
      const pinHash = await bcrypt.hash(defaultPin, 10);

      const name = customDetails.name || (candidate ? candidate.name : 'Converted Employee');
      let finalEmail = customDetails.email || candidate?.email;
      if (!finalEmail) {
        finalEmail = `${empCode.toLowerCase()}@company.com`;
      } else {
        const emailCheck = await client.query(
          'SELECT id FROM employees WHERE email = $1 AND id != $2',
          [finalEmail, empCode]
        );
        if (emailCheck.rows.length > 0) {
          const cleanName = (candidate?.name || 'emp').toLowerCase().replace(/[^a-z0-9]/g, '');
          const numPart = empCode.replace(/[^0-9]/g, '');
          finalEmail = `${cleanName}${numPart ? '.' + numPart : ''}@company.com`;
        }
      }

      const phone = customDetails.phone || (candidate ? candidate.phone : '+91 98765 00000');
      const department = customDetails.department || (candidate ? candidate.department : 'Engineering');
      const designation = customDetails.designation || (candidate ? candidate.applied_position : 'Software Engineer');
      
      // ANNUAL SALARY IS THE SOURCE OF TRUTH
      let annualSalary = Number(customDetails.annualSalary || customDetails.annualCtc || candidate?.expected_salary || 0);
      if (!annualSalary) {
        const rawSal = Number(customDetails.salary || 0);
        annualSalary = rawSal >= 100000 ? rawSal : Math.round(rawSal * 12);
      }
      if (!annualSalary) annualSalary = 400000;
      
      const salary = Math.round((annualSalary / 12) * 100) / 100;
      const basicSalary = Math.round((salary * 0.6) * 100) / 100;
      const allowances = Math.round((salary * 0.4) * 100) / 100;

      // 3. Insert or Update employees table cleanly
      let newEmployee;
      if (existingEmp) {
        const targetId = existingEmp.id;
        const updateRes = await client.query(
          `UPDATE employees 
           SET name = $2, department = $3, designation = $4,
               annual_salary = $5, annual_ctc = $5, salary = $6, basic_salary = $7, allowances = $8,
               status = 'Active', updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1 OR emp_code = $1 
           RETURNING *`,
          [targetId, name, department, designation, annualSalary, salary, basicSalary, allowances]
        );
        newEmployee = updateRes.rows[0];
      } else {
        const insertRes = await client.query(
          `INSERT INTO employees 
           (id, emp_code, name, email, phone, department, designation, joining_date, status,
            annual_salary, annual_ctc, salary, basic_salary, allowances,
            reporting_manager_id, reporting_manager_name, pan_number, uan_number, bank_account, ifsc_code, pin_hash, plain_pin)
           VALUES ($1, $1, $2, $3, $4, $5, $6, CURRENT_DATE, 'Joined', $7, $7, $8, $9, $10, 'EMP-001', 'Sarah Jenkins', 'ABCDE1234F', '100987654321', '98765432101', 'HDFC0001234', $11, $12)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             department = EXCLUDED.department,
             designation = EXCLUDED.designation,
             joining_date = CURRENT_DATE,
             annual_salary = EXCLUDED.annual_salary,
             annual_ctc = EXCLUDED.annual_ctc,
             salary = EXCLUDED.salary,
             basic_salary = EXCLUDED.basic_salary,
             allowances = EXCLUDED.allowances,
             status = 'Joined',
             updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [empCode, name, finalEmail, phone, department, designation, annualSalary, salary, basicSalary, allowances, pinHash, defaultPin]
        );
        newEmployee = insertRes.rows[0];
      }

      const targetEmpId = newEmployee?.emp_code || newEmployee?.id || empCode;

      // 3B. Insert into employee_onboarding pipeline table
      await client.query(
        `INSERT INTO employee_onboarding (employee_id, current_stage, stage, joined_date)
         VALUES ($1, 'JOINED', 'Joined', CURRENT_DATE)
         ON CONFLICT (employee_id) DO UPDATE SET current_stage = 'JOINED', stage = 'Joined', updated_at = CURRENT_TIMESTAMP`,
        [targetEmpId]
      );

      // 4. Insert into employee_bank_details table
      await client.query(
        `INSERT INTO employee_bank_details (id, employee_id, bank_name, account_number, ifsc_code) 
         VALUES ($1, $2, 'HDFC Bank', '98765432101', 'HDFC0001234')
         ON CONFLICT (id) DO NOTHING`,
        [`BANK-${targetEmpId}`, targetEmpId]
      );

      // 5. Insert into employee_statutory table
      await client.query(
        `INSERT INTO employee_statutory (id, employee_id, pan_number, uan_number) 
         VALUES ($1, $2, 'ABCDE1234F', '100987654321')
         ON CONFLICT (id) DO NOTHING`,
        [`STAT-${targetEmpId}`, targetEmpId]
      );

      // 6. Insert into employee_documents table
      await client.query(
        `INSERT INTO employee_documents (id, employee_id, document_type, file_name, file_url) 
         VALUES ($1, $2, 'Offer Letter', 'Offer_Letter.pdf', 'https://example.com/documents/offer.pdf')
         ON CONFLICT (id) DO NOTHING`,
        [`DOC-${targetEmpId}`, targetEmpId]
      );

      // 7. Insert into employee_shift_history table
      await client.query(
        `INSERT INTO employee_shift_history (id, employee_id, shift_id, effective_from) 
         VALUES ($1, $2, 'shift-gen', CURRENT_DATE)
         ON CONFLICT (id) DO NOTHING`,
        [`HIST-${targetEmpId}`, targetEmpId]
      );

      // 8. Insert into leave_balances table (12 CL, 10 SL, 15 PL)
      const leaveTypes = [
        { code: 'CL', name: 'Casual Leave (CL)', allowance: 12 },
        { code: 'SL', name: 'Sick Leave (SL)', allowance: 10 },
        { code: 'PL', name: 'Privilege Leave (PL)', allowance: 15 }
      ];

      for (const lt of leaveTypes) {
        await client.query(
          `INSERT INTO leave_balances (id, employee_id, leave_type_id, leave_type_name, total_allocated, allocated, used, pending, available, balance, year)
           VALUES ($1, $2, $3, $4, $5, $5, 0, 0, $5, $5, EXTRACT(YEAR FROM CURRENT_DATE))
           ON CONFLICT DO NOTHING`,
          [`LB-${targetEmpId}-${lt.code}`, targetEmpId, `lt-${lt.code.toLowerCase()}`, lt.name, lt.allowance]
        );
      }

      // 9. Update Candidate status to 'CONVERTED' & stage = 'Employee'
      if (candidate) {
        await client.query(
          "UPDATE job_candidates SET stage = 'Employee', status = 'CONVERTED', employee_id = $1, updated_at = NOW() WHERE id = $2 OR candidate_no = $2",
          [targetEmpId, candidate.id]
        );
      }

      // 10. Audit log entry
      await client.query(
        `INSERT INTO activity_logs (module, entity, entity_id, action, new_value, performed_by)
         VALUES ('recruitment', 'employee_conversion', $1, 'candidate_converted_to_employee', $2, 'HR Admin')`,
        [empCode, `${name} converted from candidate ${candidateId}`]
      );

      // 11. Commit Transaction
      await client.query('COMMIT');

      return {
        success: true,
        message: `Candidate ${name} converted successfully to HRMS Employee Master (${empCode})!`,
        employee: newEmployee
      };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('CONVERT ERROR TRACE:', err);
      throw err;
    } finally {
      client.release();
    }
  }
}
