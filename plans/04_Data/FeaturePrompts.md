# 04 Data Feature Prompts

Use these prompts for dataset design, schema design, and retrieval inputs.

## DataCollection.md

Define how academic data is collected, normalized, approved, and stored. Include official sources, upload paths, validation, and retention.

Requirements:

- Prioritize institutional sources.
- Respect privacy and access boundaries.
- Make provenance explicit.

## UniversityDatasets.md

Describe the dataset types needed to support the product. Include syllabi, outcomes, rubrics, question papers, results, policies, and reports.

Requirements:

- List each dataset with purpose and owner.
- Note format variations across institutions.
- Show what can be imported versus manually created.

## MetadataSchema.md

Design a metadata schema that makes every academic object searchable, traceable, and linkable. Include ownership, versioning, tags, outcomes, topics, and evidence links.

Requirements:

- Keep fields normalized.
- Support future extensions.
- Align with the knowledge graph.

## EmbeddingStrategy.md

Describe how text, tables, rubrics, and structured records should be embedded and retrieved. Explain how you handle chunking and semantic retrieval by academic type.

Requirements:

- Optimize for grounded retrieval.
- Preserve section-level meaning.
- Keep the strategy consistent with provenance.

## RetrievalPipeline.md

Define the retrieval pipeline from query to ranked sources to final answer. Include filters, reranking, citation, and fallback handling.

Requirements:

- Show how the system avoids hallucination.
- Make source selection explainable.
- Include failure handling.
