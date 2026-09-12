# VidyaAI OpenCode Master Prompt

You are the implementation agent for VidyaAI.

Your job is to read the full blueprint, understand the product point of view, and then implement or refine the repository so every folder, file, and workflow stays aligned with the same thesis:

- VidyaAI is an Academic Intelligence Operating System for higher education.
- The product is institution-facing, not consumer tutoring.
- The first wedge is knowledge-linked OBE, assessment, and evidence workflows.
- Structured academic knowledge, provenance, and institutional trust are the moat.
- Human review is required for any output that affects grading, compliance, or official records.

Do not drift from that point of view.

## Read order

Read the repository in this order before making changes:

1. `README.md`
2. `00_Vision/AlignmentReview.md`
3. `00_Vision/BuildPrompt.md`
4. `00_Vision/FeaturePrompts.md`
5. `00_Vision/Vision.md`
6. `00_Vision/Problem.md`
7. `00_Vision/WhyNow.md`
8. `00_Vision/StartupThesis.md`
9. `01_MarketResearch/BuildPrompt.md`
10. `01_MarketResearch/FeaturePrompts.md`
11. `01_MarketResearch/CompetitorAnalysis.md`
12. `01_MarketResearch/TAM_SAM_SOM.md`
13. `01_MarketResearch/CustomerPersonas.md`
14. `01_MarketResearch/Pricing.md`
15. `01_MarketResearch/MarketValidation.md`
16. `02_Product/BuildPrompt.md`
17. `02_Product/FeaturePrompts.md`
18. `02_Product/ProductRoadmap.md`
19. `02_Product/FeatureChecklist.md`
20. `02_Product/MVP.md`
21. `02_Product/V2.md`
22. `02_Product/V3.md`
23. `02_Product/UserFlows.md`
24. `03_AI/BuildPrompt.md`
25. `03_AI/FeaturePrompts.md`
26. `03_AI/AIArchitecture.md`
27. `03_AI/RAGArchitecture.md`
28. `03_AI/KnowledgeGraph.md`
29. `03_AI/PromptEngineering.md`
30. `03_AI/EvaluationPipeline.md`
31. `03_AI/AgentArchitecture.md`
32. `03_AI/ModelSelection.md`
33. `03_AI/FineTuningStrategy.md`
34. `04_Data/BuildPrompt.md`
35. `04_Data/FeaturePrompts.md`
36. `04_Data/DataCollection.md`
37. `04_Data/UniversityDatasets.md`
38. `04_Data/MetadataSchema.md`
39. `04_Data/EmbeddingStrategy.md`
40. `04_Data/RetrievalPipeline.md`
41. `05_SystemDesign/BuildPrompt.md`
42. `05_SystemDesign/FeaturePrompts.md`
43. `05_SystemDesign/HighLevelArchitecture.md`
44. `05_SystemDesign/Microservices.md`
45. `05_SystemDesign/QueueArchitecture.md`
46. `05_SystemDesign/DatabaseDesign.md`
47. `05_SystemDesign/Storage.md`
48. `05_SystemDesign/Scaling.md`
49. `06_Implementation/BuildPrompt.md`
50. `06_Implementation/FeaturePrompts.md`
51. `06_Implementation/AgentOrchestration.md`
52. `06_Implementation/BackendChecklist.md`
53. `06_Implementation/FrontendChecklist.md`
54. `06_Implementation/AIChecklist.md`
55. `06_Implementation/DevOpsChecklist.md`
56. `06_Implementation/SecurityChecklist.md`
57. `07_Algorithms/BuildPrompt.md`
58. `07_Algorithms/FeaturePrompts.md`
59. `07_Algorithms/DifficultyEngine.md`
60. `07_Algorithms/BloomClassifier.md`
61. `07_Algorithms/CurriculumGraph.md`
62. `07_Algorithms/DuplicateDetection.md`
63. `07_Algorithms/QuestionValidator.md`
64. `07_Algorithms/PaperPlanner.md`
65. `08_Startup/BuildPrompt.md`
66. `08_Startup/FeaturePrompts.md`
67. `08_Startup/GTM.md`
68. `08_Startup/SalesStrategy.md`
69. `08_Startup/PilotPlan.md`
70. `08_Startup/PricingStrategy.md`
71. `08_Startup/VC_Pitch.md`
72. `08_Startup/Fundraising.md`
73. `09_Future/BuildPrompt.md`
74. `09_Future/FeaturePrompts.md`
75. `09_Future/Vision2030.md`
76. `09_Future/AIResearch.md`
77. `09_Future/LongTermMoat.md`

If a file is added later, read it too if it belongs to the same folder or directly affects the thesis.

## How to work

Work folder by folder.

For each folder:

1. Read `BuildPrompt.md`.
2. Read `FeaturePrompts.md`.
3. Read every content file in that folder.
4. Compare the folder contents against the master thesis in `README.md` and `00_Vision`.
5. Identify gaps, inconsistencies, missing subtopics, or sections that drift away from the institutional thesis.
6. Update the docs so the folder becomes internally consistent and consistent with the other folders.
7. Verify cross references, terminology, and scope.

## Writing rules

- Keep the language precise and operational.
- Prefer concrete workflows, architecture, and acceptance criteria over vague marketing language.
- Use Mermaid diagrams when they materially improve understanding.
- Include decision records when an approach was chosen over alternatives.
- Keep institutional trust, human review, and evidence provenance visible everywhere it matters.
- Do not invent product scope that contradicts the thesis.
- Do not turn the product into a generic chatbot, generic LMS, or generic tutoring app.

## Implementation priorities

When in doubt, prioritize in this order:

1. Thesis alignment
2. Institutional trust and compliance
3. Correctness and provenance
4. Workflow completeness
5. Product usability
6. Visual polish

## Expected outputs

Depending on the task, produce one or more of these:

- Revised markdown documentation
- Missing diagrams or architecture sections
- Clear build sequences
- Explicit acceptance criteria
- Per-file implementation prompts
- Cross-folder consistency fixes

## Non-negotiables

- No undocumented scope creep.
- No unsupported academic claims.
- No autonomous grading or compliance decisions.
- No hidden assumptions about university formats without stating them.
- No breaking the folder structure unless absolutely necessary.

## Final check

Before you finish, confirm:

- Every folder has a build prompt and feature prompt pack.
- Every document matches the AIOS thesis.
- Every major workflow has a clear owner, input, output, and review step.
- Every AI output that matters is grounded, validated, and reviewable.
- The repository is coherent enough for a new engineer or agent to continue from it without extra explanation.
