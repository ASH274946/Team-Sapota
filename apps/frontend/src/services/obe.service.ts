import { api } from '@/lib/api';
import type {
  Course,
  Program,
  CourseOutcome,
  ProgramOutcome,
  CoPoMapping,
  CurriculumGraph,
  Blueprint,
  BlueprintItem,
  BlueprintValidation,
  CoAttainmentResponse,
  PoAttainmentResponse,
  AttainmentDashboard,
  MappingIntegrity,
  CreateCourseData,
  CreateProgramData,
  CreateCourseOutcomeData,
  CreateProgramOutcomeData,
  UpsertCoPoMappingData,
  CreateBlueprintData,
  AddBlueprintItemData,
  MappingReview,
} from '@/types/obe.types';

export async function listCourses(departmentId?: string): Promise<Course[]> {
  const params = departmentId ? `?departmentId=${departmentId}` : '';
  const res = await api.get(`/obe/courses${params}`);
  return res.data.data;
}

export async function createCourse(data: CreateCourseData): Promise<Course> {
  const res = await api.post('/obe/courses', data);
  return res.data.data;
}

export async function getCurriculumGraph(courseId: string): Promise<CurriculumGraph> {
  const res = await api.get(`/obe/courses/${courseId}`);
  return res.data.data;
}

export async function validateMappingIntegrity(courseId: string): Promise<MappingIntegrity> {
  const res = await api.post(`/obe/courses/${courseId}/validate`);
  return res.data.data;
}

export async function listCourseOutcomes(courseId: string): Promise<CourseOutcome[]> {
  const res = await api.get(`/obe/courses/${courseId}/outcomes`);
  return res.data.data;
}

export async function createCourseOutcome(courseId: string, data: CreateCourseOutcomeData): Promise<CourseOutcome> {
  const res = await api.post(`/obe/courses/${courseId}/outcomes`, data);
  return res.data.data;
}

export async function updateCourseOutcome(id: string, data: Partial<CreateCourseOutcomeData>): Promise<CourseOutcome> {
  const res = await api.put(`/obe/outcomes/${id}`, data);
  return res.data.data;
}

export async function deleteCourseOutcome(id: string): Promise<void> {
  await api.delete(`/obe/outcomes/${id}`);
}

export async function listPrograms(): Promise<Program[]> {
  const res = await api.get('/obe/programs');
  return res.data.data;
}

export async function createProgram(data: CreateProgramData): Promise<Program> {
  const res = await api.post('/obe/programs', data);
  return res.data.data;
}

export async function listProgramOutcomes(programId: string): Promise<ProgramOutcome[]> {
  const res = await api.get(`/obe/programs/${programId}/outcomes`);
  return res.data.data;
}

export async function createProgramOutcome(programId: string, data: CreateProgramOutcomeData): Promise<ProgramOutcome> {
  const res = await api.post(`/obe/programs/${programId}/outcomes`, data);
  return res.data.data;
}

export async function updateProgramOutcome(id: string, data: Partial<CreateProgramOutcomeData>): Promise<ProgramOutcome> {
  const res = await api.put(`/obe/program-outcomes/${id}`, data);
  return res.data.data;
}

export async function deleteProgramOutcome(id: string): Promise<void> {
  await api.delete(`/obe/program-outcomes/${id}`);
}

export async function upsertCoPoMapping(data: UpsertCoPoMappingData): Promise<CoPoMapping> {
  const res = await api.post('/obe/mappings', data);
  return res.data.data;
}

export async function bulkUpsertCoPoMappings(
  mappings: Array<{ coId: string; poId: string; weightage: number }>,
  reason?: string
): Promise<CoPoMapping[]> {
  const res = await api.post('/obe/mappings/bulk', { mappings, reason });
  return res.data.data;
}

export async function getMappingHistory(coId: string, poId: string): Promise<MappingReview[]> {
  const res = await api.get(`/obe/mappings/${coId}/${poId}/history`);
  return res.data.data;
}

export async function listBlueprints(courseId: string): Promise<Blueprint[]> {
  const res = await api.get(`/obe/courses/${courseId}/blueprints`);
  return res.data.data;
}

export async function createBlueprint(data: CreateBlueprintData): Promise<Blueprint> {
  const res = await api.post(`/obe/courses/${data.courseId}/blueprints`, data);
  return res.data.data;
}

export async function getBlueprint(id: string): Promise<Blueprint> {
  const res = await api.get(`/obe/blueprints/${id}`);
  return res.data.data;
}

export async function addBlueprintItem(blueprintId: string, data: AddBlueprintItemData): Promise<BlueprintItem> {
  const res = await api.post(`/obe/blueprints/${blueprintId}/items`, data);
  return res.data.data;
}

export async function updateBlueprintItem(
  blueprintId: string,
  itemId: string,
  data: Partial<AddBlueprintItemData>
): Promise<BlueprintItem> {
  const res = await api.put(`/obe/blueprints/${blueprintId}/items/${itemId}`, data);
  return res.data.data;
}

export async function removeBlueprintItem(blueprintId: string, itemId: string): Promise<void> {
  await api.delete(`/obe/blueprints/${blueprintId}/items/${itemId}`);
}

export async function validateBlueprint(id: string): Promise<BlueprintValidation> {
  const res = await api.post(`/obe/blueprints/${id}/validate`);
  return res.data.data;
}

export async function submitBlueprintForReview(id: string): Promise<Blueprint> {
  const res = await api.post(`/obe/blueprints/${id}/submit`);
  return res.data.data;
}

export async function approveBlueprint(id: string, comments?: string): Promise<Blueprint> {
  const res = await api.post(`/obe/blueprints/${id}/approve`, { comments });
  return res.data.data;
}

export async function rejectBlueprint(id: string, reason: string): Promise<Blueprint> {
  const res = await api.post(`/obe/blueprints/${id}/reject`, { reason });
  return res.data.data;
}

export async function getAttainmentDashboard(courseId: string, threshold?: number): Promise<AttainmentDashboard> {
  const params = threshold !== undefined ? `?threshold=${threshold}` : '';
  const res = await api.get(`/obe/courses/${courseId}/attainment${params}`);
  return res.data.data;
}

export async function getCoAttainment(courseId: string, threshold?: number): Promise<CoAttainmentResponse> {
  const params = threshold !== undefined ? `?threshold=${threshold}` : '';
  const res = await api.get(`/obe/courses/${courseId}/attainment/co${params}`);
  return res.data.data;
}

export async function getPoAttainment(threshold?: number): Promise<PoAttainmentResponse> {
  const params = threshold !== undefined ? `?threshold=${threshold}` : '';
  const res = await api.get(`/obe/attainment/po${params}`);
  return res.data.data;
}
