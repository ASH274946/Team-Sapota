# 07 Algorithms Feature Prompts

Use these prompts for the system logic that powers academic intelligence.

## DifficultyEngine.md

Design the difficulty scoring logic for questions, assignments, and generated practice content.

Requirements:

- Define the inputs and outputs.
- Explain how difficulty is calibrated.
- Keep the logic explainable to educators.

## BloomClassifier.md

Design the Bloom taxonomy classifier for learning objectives and questions.

Requirements:

- Show how classification works.
- Handle ambiguous cases.
- Keep outputs structured and reviewable.

## CurriculumGraph.md

Design the curriculum graph that links topics, outcomes, assessments, and prerequisite relationships.

Requirements:

- Make prerequisite logic explicit.
- Support semester and course planning.
- Connect the graph to the knowledge layer.

## DuplicateDetection.md

Design the duplicate and near-duplicate detection logic for questions, content, and evidence artifacts.

Requirements:

- Balance strict and fuzzy matching.
- Explain when a match is a warning versus a block.
- Keep provenance visible.

## QuestionValidator.md

Design the validator that checks generated questions for syllabus fit, outcome fit, correctness, and formatting.

Requirements:

- Include invalidation reasons.
- Support human review.
- Prevent unsafe or off-target questions.

## PaperPlanner.md

Design the paper planning logic for generating balanced, syllabus-aligned question papers.

Requirements:

- Respect marks distribution and Bloom coverage.
- Support institution-specific rules.
- Produce a clear rationale for the output.
