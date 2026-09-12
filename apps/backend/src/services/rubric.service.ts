import prisma from '../config/prisma';


export class RubricService {
  /**
   * Retrieves a rubric including its nested sub-criteria.
   */
  static async getRubricWithCriteria(rubricId: string) {
    return prisma.rubric.findUnique({
      where: { id: rubricId },
      include: {
        criteria: {
          include: {
            subCriteria: true // Depth of 1 for now
          }
        }
      }
    });
  }

  /**
   * Versions an existing rubric by creating a clone of it.
   * The new clone starts in DRAFT status.
   */
  static async createNewVersion(rubricId: string, authorId: string) {
    const existing = await this.getRubricWithCriteria(rubricId);
    if (!existing) {
      throw new Error(`Rubric ${rubricId} not found`);
    }

    // 1. Create the base clone
    const newVersion = await prisma.rubric.create({
      data: {
        title: existing.title,
        description: existing.description,
        department: existing.department,
        course: existing.course,
        subject: existing.subject,
        chapter: existing.chapter,
        topic: existing.topic,
        difficulty: existing.difficulty,
        language: existing.language,
        organizationId: existing.organizationId,
        authorId: authorId,
        
        // Version bumping
        version: existing.version + 1,
        status: 'DRAFT',
        previousVersionId: existing.id
      }
    });

    // 2. Clone all criteria
    for (const criterion of existing.criteria) {
      if (!criterion.parentId) { // Top level
        const newParent = await prisma.rubricCriterion.create({
          data: {
            rubricId: newVersion.id,
            name: criterion.name,
            description: criterion.description,
            maxMarks: criterion.maxMarks,
            minMarks: criterion.minMarks,
            expectedConcepts: criterion.expectedConcepts ?? undefined,
            expectedKeywords: criterion.expectedKeywords ?? undefined,
            bloomLevel: criterion.bloomLevel,
            difficulty: criterion.difficulty,
            teacherNotes: criterion.teacherNotes
          }
        });

        // 3. Clone its sub-criteria
        for (const sub of criterion.subCriteria) {
          await prisma.rubricCriterion.create({
            data: {
              rubricId: newVersion.id,
              parentId: newParent.id,
              name: sub.name,
              description: sub.description,
              maxMarks: sub.maxMarks,
              minMarks: sub.minMarks,
              expectedConcepts: sub.expectedConcepts ?? undefined,
              expectedKeywords: sub.expectedKeywords ?? undefined,
              bloomLevel: sub.bloomLevel,
              difficulty: sub.difficulty,
              teacherNotes: sub.teacherNotes
            }
          });
        }
      }
    }

    return newVersion;
  }

  static async publishRubric(rubricId: string) {
    // A production system might trigger a background job to generate embeddings for Hybrid RAG here.
    return prisma.rubric.update({
      where: { id: rubricId },
      data: { status: 'PUBLISHED' }
    });
  }

  static async archiveRubric(rubricId: string) {
    return prisma.rubric.update({
      where: { id: rubricId },
      data: { status: 'ARCHIVED' }
    });
  }
}
