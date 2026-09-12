import { Request, Response } from 'express';
import { sendSuccess, sendCreated, sendNoContent } from '../common/response';
import { getRequestUserId, requireRequestOrgId } from '../../security/request-context';
import { CurriculumGraphService } from '../../services/obe/curriculum-graph.service';
import { BlueprintService } from '../../services/obe/blueprint.service';
import { AttainmentService } from '../../services/obe/attainment.service';
import { MappingReviewService } from '../../services/obe/mapping-review.service';

export const listCourses = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const departmentId = req.query.departmentId as string | undefined;
  const courses = await CurriculumGraphService.listCourses(orgId, departmentId);
  sendSuccess(res, { data: courses });
};

export const createCourse = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { name, code, description, departmentId } = req.body;
  const course = await CurriculumGraphService.createCourse({ name, code, description, departmentId, organizationId: orgId });
  sendCreated(res, course);
};

export const listPrograms = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const programs = await CurriculumGraphService.listPrograms(orgId);
  sendSuccess(res, { data: programs });
};

export const createProgram = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { name, code, description } = req.body;
  const program = await CurriculumGraphService.createProgram({ name, code, description, organizationId: orgId });
  sendCreated(res, program);
};

export const createCourseOutcome = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { courseId } = req.params;
  const { code, description, bloomLevel } = req.body;
  const co = await CurriculumGraphService.createCourseOutcome({ code, description, bloomLevel, courseId, organizationId: orgId });
  sendCreated(res, co);
};

export const updateCourseOutcome = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { id } = req.params;
  const co = await CurriculumGraphService.updateCourseOutcome(id, orgId, req.body);
  sendSuccess(res, { data: co });
};

export const deleteCourseOutcome = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { id } = req.params;
  await CurriculumGraphService.deleteCourseOutcome(id, orgId);
  sendNoContent(res);
};

export const createProgramOutcome = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { programId } = req.params;
  const { code, description } = req.body;
  const po = await CurriculumGraphService.createProgramOutcome({ code, description, programId, organizationId: orgId });
  sendCreated(res, po);
};

export const updateProgramOutcome = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { id } = req.params;
  const po = await CurriculumGraphService.updateProgramOutcome(id, orgId, req.body);
  sendSuccess(res, { data: po });
};

export const deleteProgramOutcome = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { id } = req.params;
  await CurriculumGraphService.deleteProgramOutcome(id, orgId);
  sendNoContent(res);
};

export const upsertCoPoMapping = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const userId = getRequestUserId(req);
  const { coId, poId, weightage, reason } = req.body;
  const mapping = await CurriculumGraphService.upsertCoPoMapping({
    coId, poId, weightage, organizationId: orgId, changedById: userId, reason,
  });
  sendSuccess(res, { data: mapping });
};

export const bulkUpsertCoPoMappings = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const userId = getRequestUserId(req);
  const { mappings, reason } = req.body;
  const results = await CurriculumGraphService.bulkUpsertCoPoMappings({
    mappings, organizationId: orgId, changedById: userId, reason,
  });
  sendSuccess(res, { data: results });
};

export const getCurriculumGraph = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { courseId } = req.params;
  const graph = await CurriculumGraphService.getCurriculumGraph(courseId, orgId);
  sendSuccess(res, { data: graph });
};

export const validateMappingIntegrity = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { courseId } = req.params;
  const result = await CurriculumGraphService.validateMappingIntegrity(courseId, orgId);
  sendSuccess(res, { data: result });
};

export const getMappingHistory = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { coId, poId } = req.params;
  const history = await CurriculumGraphService.getMappingHistory(coId, poId, orgId);
  sendSuccess(res, { data: history });
};

export const listCourseOutcomes = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { courseId } = req.params;
  const graph = await CurriculumGraphService.getCurriculumGraph(courseId, orgId);
  sendSuccess(res, { data: graph.courseOutcomes });
};

export const listProgramOutcomes = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { programId } = req.params;
  const programs = await CurriculumGraphService.listPrograms(orgId);
  const program = programs.find((p) => p.id === programId);
  if (!program) {
    const { ApiError } = await import('../common/errors');
    throw ApiError.notFound('Program not found');
  }
  const outcomes = await CurriculumGraphService.listProgramOutcomes(programId, orgId);
  sendSuccess(res, { data: outcomes });
};

export const listPendingBlueprints = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const blueprints = await BlueprintService.listPendingBlueprints(orgId);
  sendSuccess(res, { data: blueprints });
};

export const listBlueprints = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { courseId } = req.params;
  const blueprints = await BlueprintService.listBlueprints(courseId, orgId);
  sendSuccess(res, { data: blueprints });
};

export const createBlueprint = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const userId = getRequestUserId(req);
  const blueprint = await BlueprintService.createBlueprint({ ...req.body, organizationId: orgId, createdBy: userId });
  sendCreated(res, blueprint);
};

export const getBlueprint = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { id } = req.params;
  const blueprint = await BlueprintService.getBlueprint(id, orgId);
  sendSuccess(res, { data: blueprint });
};

export const addBlueprintItem = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { id } = req.params;
  const item = await BlueprintService.addItem(id, orgId, req.body);
  sendCreated(res, item);
};

export const updateBlueprintItem = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { blueprintId, itemId } = req.params;
  const item = await BlueprintService.updateItem(itemId, blueprintId, orgId, req.body);
  sendSuccess(res, { data: item });
};

export const removeBlueprintItem = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { blueprintId, itemId } = req.params;
  await BlueprintService.removeItem(itemId, blueprintId, orgId);
  sendNoContent(res);
};

export const validateBlueprint = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { id } = req.params;
  const result = await BlueprintService.validateBlueprintById(id, orgId);
  sendSuccess(res, { data: result });
};

export const approveBlueprint = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const userId = getRequestUserId(req);
  const { id } = req.params;
  const { comments } = req.body;
  const blueprint = await BlueprintService.approveBlueprint(id, orgId, userId, comments);
  sendSuccess(res, { data: blueprint });
};

export const rejectBlueprint = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const userId = getRequestUserId(req);
  const { id } = req.params;
  const { reason } = req.body;
  const blueprint = await BlueprintService.rejectBlueprint(id, orgId, userId, reason);
  sendSuccess(res, { data: blueprint });
};

export const submitBlueprintForReview = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { id } = req.params;
  const blueprint = await BlueprintService.submitForReview(id, orgId);
  sendSuccess(res, { data: blueprint });
};

export const getCoAttainment = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { courseId } = req.params;
  const threshold = Number(req.query.threshold) || 0.6;
  const result = await AttainmentService.calculateCoAttainment(courseId, orgId, threshold);
  sendSuccess(res, { data: result });
};

export const getPoAttainment = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const threshold = Number(req.query.threshold) || 0.6;
  const result = await AttainmentService.calculatePoAttainment(orgId, threshold);
  sendSuccess(res, { data: result });
};

export const getAttainmentDashboard = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { courseId } = req.params;
  const result = await AttainmentService.getAttainmentDashboard(courseId, orgId);
  sendSuccess(res, { data: result });
};

export const getFlaggedCos = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { courseId } = req.params;
  const threshold = Number(req.query.threshold) || 0.6;
  const result = await AttainmentService.getFlaggedCos(courseId, orgId, threshold);
  sendSuccess(res, { data: result });
};

export const getMappingChangeHistory = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { mappingId } = req.params;
  const history = await MappingReviewService.getChangeHistory(mappingId, orgId);
  sendSuccess(res, { data: history });
};

export const getRecentMappingChanges = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const from = req.query.from ? new Date(req.query.from as string) : undefined;
  const to = req.query.to ? new Date(req.query.to as string) : undefined;
  if (from && isNaN(from.getTime())) throw (await import('../common/errors')).ApiError.badRequest('Invalid "from" date');
  if (to && isNaN(to.getTime())) throw (await import('../common/errors')).ApiError.badRequest('Invalid "to" date');
  const changes = await MappingReviewService.getRecentChanges(orgId, { from, to });
  sendSuccess(res, { data: changes });
};

export const getMappingChangeStats = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const stats = await MappingReviewService.getChangeStats(orgId);
  sendSuccess(res, { data: stats });
};

export const getCoPoMatrixController = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { id } = req.params;
  const matrix = await CurriculumGraphService.getCoPoMatrix(id, orgId);
  sendSuccess(res, { data: matrix });
};

export const updateCoPoMatrixController = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const userId = getRequestUserId(req);
  const { id } = req.params;
  const { mappings, bloomOverrides, reason } = req.body;
  const updated = await CurriculumGraphService.updateCoPoMatrix(id, orgId, {
    mappings,
    bloomOverrides,
    changedById: userId,
    reason,
  });
  sendSuccess(res, { data: updated });
};

export const classifyBloomController = async (req: Request, res: Response): Promise<void> => {
  const { text, config } = req.body;
  const { BloomClassifierService } = await import('../../services/obe/bloom.service');
  const result = BloomClassifierService.classify(text, config);
  sendSuccess(res, { data: result });
};

export const generateBlueprintQuestionsController = async (req: Request, res: Response): Promise<void> => {
  const { title, totalMarks = 100, examType = 'MID_SEM', units = [], courseName = '', courseCode = '' } = req.body;

  const isMid = totalMarks <= 60 || examType === 'MID_SEM';
  const isQuiz = totalMarks <= 30;
  const sections: any[] = [];
  const subjectQuery = `${title} ${courseName} ${courseCode}`;

  const cLower = subjectQuery.toLowerCase();
  const getUT = (idx: number, fallback: string) => {
    const u = units[idx];
    if (!u) return fallback;
    const t = u.topics && u.topics.length > 0 ? u.topics.slice(0, 2).join(', ') : u.title;
    return `${u.title.replace(/^Unit \d+:\s*/i, '')} (${t})`;
  };

  let domainData: { partA: any[]; partB: any[]; partC: any[] };

  if (cLower.includes('operating system') || cLower.includes('os')) {
    domainData = {
      partA: [
        { text: 'Explain Process Control Block (PCB) state transitions and context switching overhead.', coId: 'CO1', bloom: 'UNDERSTAND', marks: 2 },
        { text: 'Differentiate between User Mode and Kernel Mode execution modes.', coId: 'CO1', bloom: 'UNDERSTAND', marks: 2 },
        { text: 'State key applications of Mutexes vs Counting Semaphores in process synchronization.', coId: 'CO2', bloom: 'REMEMBER', marks: 2 },
        { text: 'Describe the four necessary Coffman conditions for Deadlock occurrence.', coId: 'CO2', bloom: 'UNDERSTAND', marks: 2 },
        { text: 'Define Page Fault handling process in Virtual Memory Paging architecture.', coId: 'CO3', bloom: 'REMEMBER', marks: 2 },
        { text: 'Compare FCFS, SSTF, and SCAN disk scheduling algorithms.', coId: 'CO4', bloom: 'ANALYZE', marks: 2 },
        { text: 'Explain Inode structure and file allocation methods in Linux file systems.', coId: 'CO4', bloom: 'UNDERSTAND', marks: 2 },
        { text: 'Differentiate between Preemptive and Non-Preemptive CPU scheduling.', coId: 'CO5', bloom: 'ANALYZE', marks: 2 },
        { text: 'Explain Thrashing and Working Set Model in memory management.', coId: 'CO5', bloom: 'UNDERSTAND', marks: 2 },
        { text: 'Define Access Control Matrix and Operating System security mechanisms.', coId: 'CO6', bloom: 'REMEMBER', marks: 2 }
      ],
      partB: [
        { text: 'Demonstrate Round-Robin and Shortest Remaining Time First (SRTF) scheduling for 5 processes and calculate average Turnaround & Waiting Times.', coId: 'CO2', bloom: 'APPLY', marks: 10 },
        { text: 'Analyze Banker\'s Algorithm for Deadlock Avoidance given Allocation, Max, and Available matrices to determine if system is in a Safe State.', coId: 'CO3', bloom: 'ANALYZE', marks: 10 },
        { text: 'Execute LRU, FIFO, and Optimal Page Replacement algorithms for page reference string [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2] with 3 frames.', coId: 'CO4', bloom: 'APPLY', marks: 10, isChoice: true },
        { text: 'Execute SCAN and C-SCAN Disk Scheduling algorithms for request queue [98, 183, 37, 122, 14, 124, 65, 67] starting at head 53.', coId: 'CO4', bloom: 'APPLY', marks: 10, isChoice: true }
      ],
      partC: [
        { text: 'Formulate a Bounded-Buffer Producer-Consumer synchronization model using Semaphores. Provide C/Pthreads pseudo-code and race condition protection.', coId: 'CO5', bloom: 'EVALUATE', marks: 25, isChoice: true },
        { text: 'Formulate a Multi-Level Feedback Queue CPU Scheduler supporting dynamic priority aging and I/O-bound process prioritization.', coId: 'CO5', bloom: 'EVALUATE', marks: 25, isChoice: true },
        { text: 'Formulate an end-to-end Virtual Memory Paging & TLB Translation simulator architecture with page table lookup and page fault handling.', coId: 'CO6', bloom: 'CREATE', marks: 25 }
      ]
    };
  } else if (cLower.includes('dbms') || cLower.includes('database')) {
    domainData = {
      partA: [
        { text: 'Explain 3-schema ANSI/SPARC architecture and Physical vs Logical Data Independence.', coId: 'CO1', bloom: 'UNDERSTAND', marks: 2 },
        { text: 'Differentiate between Candidate Key, Primary Key, and Foreign Key constraints.', coId: 'CO1', bloom: 'UNDERSTAND', marks: 2 },
        { text: 'State key SQL clauses for aggregation: GROUP BY, HAVING, and WHERE.', coId: 'CO2', bloom: 'REMEMBER', marks: 2 },
        { text: 'Describe Functional Dependency and Armstrong\'s Axioms.', coId: 'CO2', bloom: 'UNDERSTAND', marks: 2 },
        { text: 'Define 3rd Normal Form (3NF) vs Boyce-Codd Normal Form (BCNF).', coId: 'CO3', bloom: 'REMEMBER', marks: 2 },
        { text: 'Compare B-Tree and B+ Tree indexing structures in databases.', coId: 'CO4', bloom: 'ANALYZE', marks: 2 },
        { text: 'Explain ACID properties of database transactions.', coId: 'CO4', bloom: 'UNDERSTAND', marks: 2 },
        { text: 'Differentiate between Two-Phase Locking (2PL) and Strict 2PL concurrency protocols.', coId: 'CO5', bloom: 'ANALYZE', marks: 2 },
        { text: 'Explain Log-based recovery mechanisms (Deferred vs Immediate Update).', coId: 'CO5', bloom: 'UNDERSTAND', marks: 2 },
        { text: 'Define NoSQL document databases vs Relational SQL databases.', coId: 'CO6', bloom: 'REMEMBER', marks: 2 }
      ],
      partB: [
        { text: 'Execute Relational Algebra and SQL queries (INNER JOIN, LEFT JOIN, Nested Subqueries) for an Employee-Department relational schema.', coId: 'CO2', bloom: 'APPLY', marks: 10 },
        { text: 'Analyze and decompose a un-normalized relation R(A,B,C,D,E,F) into 3NF/BCNF given functional dependencies F = {A->B, BC->D, E->F}.', coId: 'CO3', bloom: 'ANALYZE', marks: 10 },
        { text: 'Construct a B+ Tree index of order 3 for key insertion sequence [10, 20, 30, 40, 50, 60, 70, 80] and execute leaf node splits.', coId: 'CO4', bloom: 'APPLY', marks: 10, isChoice: true },
        { text: 'Construct a Conflict Serializability precedence graph for transaction schedule S and test for serializability.', coId: 'CO4', bloom: 'APPLY', marks: 10, isChoice: true }
      ],
      partC: [
        { text: 'Formulate an ER Diagram and Relational Schema for an E-Commerce Platform supporting Customers, Orders, Payments, and Inventory with full integrity constraints.', coId: 'CO5', bloom: 'EVALUATE', marks: 25, isChoice: true },
        { text: 'Formulate a Query Optimization Plan using Heuristic Query Trees and relational algebra equivalence rules for multi-join queries.', coId: 'CO5', bloom: 'EVALUATE', marks: 25, isChoice: true },
        { text: 'Formulate a Distributed Database Transaction Manager architecture utilizing Two-Phase Commit (2PC) protocol and deadlock detection.', coId: 'CO6', bloom: 'CREATE', marks: 25 }
      ]
    };
  } else {
    // Dynamic Fallback using Unit Titles & Topics
    const u1 = getUT(0, 'Foundational Concepts');
    const u2 = getUT(1, 'Core Architecture & Implementation');
    const u3 = getUT(2, 'Analysis & Structural Evaluation');
    const u4 = getUT(3, 'Advanced Algorithms & System Models');
    const u5 = getUT(4, 'Optimization & Real-World Applications');

    domainData = {
      partA: [
        { text: `Explain fundamental principles, memory requirements, and design goals of ${u1}.`, coId: 'CO1', bloom: 'UNDERSTAND', marks: 2 },
        { text: `Differentiate between key structural models in ${u1}.`, coId: 'CO1', bloom: 'UNDERSTAND', marks: 2 },
        { text: `State primary operational applications of ${u2}.`, coId: 'CO2', bloom: 'REMEMBER', marks: 2 },
        { text: `Describe error management and optimization strategies for ${u2}.`, coId: 'CO2', bloom: 'UNDERSTAND', marks: 2 },
        { text: `Define evaluation metrics and invariants for ${u3}.`, coId: 'CO3', bloom: 'REMEMBER', marks: 2 },
        { text: `Compare processing efficiency of algorithms in ${u4}.`, coId: 'CO4', bloom: 'ANALYZE', marks: 2 },
        { text: `Explain integration models for ${u4} in enterprise systems.`, coId: 'CO4', bloom: 'UNDERSTAND', marks: 2 },
        { text: `Differentiate between static and dynamic optimization strategies in ${u5}.`, coId: 'CO5', bloom: 'ANALYZE', marks: 2 },
        { text: `Explain trade-offs between performance and resource consumption in ${u5}.`, coId: 'CO5', bloom: 'UNDERSTAND', marks: 2 },
        { text: `Define compliance and security standards for modern engineering systems.`, coId: 'CO6', bloom: 'REMEMBER', marks: 2 }
      ],
      partB: [
        { text: `Design and implement an efficient workflow for ${u2} with trace execution and state transitions.`, coId: 'CO2', bloom: 'APPLY', marks: 10 },
        { text: `Analyze and evaluate the structural transformations of ${u3} given complex operational input constraints.`, coId: 'CO3', bloom: 'ANALYZE', marks: 10 },
        { text: `Execute execution steps for algorithms in ${u4} and derive performance metrics.`, coId: 'CO4', bloom: 'APPLY', marks: 10, isChoice: true },
        { text: `Execute trade-off analysis between competing algorithmic designs in ${u4}.`, coId: 'CO4', bloom: 'APPLY', marks: 10, isChoice: true }
      ],
      partC: [
        { text: `Formulate a comprehensive optimization strategy for ${u5}. Write recurrence relations, algorithmic steps, and space complexity bounds.`, coId: 'CO5', bloom: 'EVALUATE', marks: 25, isChoice: true },
        { text: `Formulate an advanced problem-solving framework for ${u5} under high-throughput constraints.`, coId: 'CO5', bloom: 'EVALUATE', marks: 25, isChoice: true },
        { text: `Formulate an end-to-end system architecture integrating ${u2}, ${u3}, and ${u4} for enterprise-scale deployment.`, coId: 'CO6', bloom: 'CREATE', marks: 25 }
      ]
    };
  }

  if (isQuiz) {
    sections.push({
      sectionName: 'Section A: Concept Checks & Short Answers',
      instructions: 'Answer ALL 5 questions (5 marks each)',
      totalSectionMarks: totalMarks,
      questions: domainData.partA.slice(0, 5).map((item, idx) => ({
        id: `q-${idx + 1}`,
        qNo: `Q${idx + 1}`,
        questionText: item.text,
        coId: item.coId,
        bloomLevel: item.bloom,
        marks: 5
      }))
    });
  } else if (isMid) {
    sections.push(
      {
        sectionName: 'Part A: Short Answer Conceptual Questions',
        instructions: 'Answer ALL 5 questions (2 marks each)',
        totalSectionMarks: 10,
        questions: domainData.partA.slice(0, 5).map((item, idx) => ({
          id: `q-1${String.fromCharCode(97 + idx)}`,
          qNo: `1${String.fromCharCode(97 + idx)}`,
          questionText: item.text,
          coId: item.coId,
          bloomLevel: item.bloom,
          marks: 2
        }))
      },
      {
        sectionName: 'Part B: Application & Analytical Problems',
        instructions: 'Answer ANY 2 questions (10 marks each)',
        totalSectionMarks: 20,
        questions: domainData.partB.slice(0, 3).map((item, idx) => ({
          id: `q-${idx + 2}`,
          qNo: `${idx + 2}`,
          questionText: item.text,
          coId: item.coId,
          bloomLevel: item.bloom,
          marks: 10,
          isChoice: item.isChoice
        }))
      },
      {
        sectionName: 'Part C: Comprehensive System Design Problem',
        instructions: 'Compulsory 20 Marks System Implementation Problem',
        totalSectionMarks: 20,
        questions: [
          {
            id: 'q-4',
            qNo: '4',
            questionText: domainData.partC[0].text,
            coId: domainData.partC[0].coId,
            bloomLevel: domainData.partC[0].bloom,
            marks: 20
          }
        ]
      }
    );
  } else {
    // 100 Marks End-Semester Final Examination
    sections.push(
      {
        sectionName: 'Part A: Short Answer Conceptual Questions',
        instructions: 'Answer ALL 10 questions (2 marks each)',
        totalSectionMarks: 20,
        questions: domainData.partA.map((item, idx) => ({
          id: `q-1${String.fromCharCode(97 + idx)}`,
          qNo: `1${String.fromCharCode(97 + idx)}`,
          questionText: item.text,
          coId: item.coId,
          bloomLevel: item.bloom,
          marks: 2
        }))
      },
      {
        sectionName: 'Part B: Analytical & Application Modules',
        instructions: 'Answer 3 questions out of 4 (10 marks each)',
        totalSectionMarks: 30,
        questions: domainData.partB.map((item, idx) => ({
          id: `q-${idx + 2}`,
          qNo: `${idx + 2}`,
          questionText: item.text,
          coId: item.coId,
          bloomLevel: item.bloom,
          marks: 10,
          isChoice: item.isChoice
        }))
      },
      {
        sectionName: 'Part C: Advanced System Problem & Algorithmic Design',
        instructions: 'Answer 2 questions (25 marks each)',
        totalSectionMarks: 50,
        questions: domainData.partC.map((item, idx) => ({
          id: `q-${idx + 5}`,
          qNo: `${idx + 5}`,
          questionText: item.text,
          coId: item.coId,
          bloomLevel: item.bloom,
          marks: 25,
          isChoice: item.isChoice
        }))
      }
    );
  }

  const generated = {
    id: `bp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title: title || 'Examination Blueprint',
    examType: isQuiz ? 'QUIZ' : isMid ? 'MID_SEM' : 'END_SEM',
    duration: isQuiz ? '45 Mins' : isMid ? '1.5 Hours' : '3 Hours',
    totalMarks,
    difficulty: 'MODERATE',
    status: 'APPROVED',
    createdAt: new Date().toISOString().split('T')[0],
    sections,
    bloomDistribution: {
      rememberUnderstand: 20,
      applyAnalyze: isMid ? 45 : 50,
      evaluateCreate: isMid ? 35 : 30
    },
    coMarksDistribution: { CO1: 20, CO2: 20, CO3: 20, CO4: 20, CO5: 20 }
  };

  sendSuccess(res, { data: generated });
};
