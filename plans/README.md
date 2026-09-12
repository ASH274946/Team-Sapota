# VidyaAI — Future Plan

## Purpose
VidyaAI is an **Academic Intelligence Operating System (AIOS)** for Indian higher-education institutions. It converts institution-owned academic knowledge—curricula, outcomes, policies, assessment history and evidence—into governed workflows for curriculum planning, OBE, assessments, academic analytics and accreditation readiness. It is **not** an autonomous academic authority: qualified institutional staff approve every consequential artefact.

## Working assumptions
- Initial customer: autonomous/private colleges and university departments in India, beginning with engineering, management and commerce programmes.
- Wedge: a knowledge-first OBE/assessment workflow for one engineering-college department, beginning with JNTUH/JNTUK/VTU/Anna University/OU-compatible configurations only after local validation.
- Buyer: Principal/management, Dean/HOD, Controller of Examinations and IQAC/OBE leads; daily users: faculty and assessment cells.
- The attached founder notes are now the product direction. Quantitative claims and university-specific formats remain hypotheses to validate in pilots.

## How to use this repository
Read `00_Vision` first, then `01_MarketResearch`, `02_Product`, `03_AI`, `04_Data`, and `05_SystemDesign`. Checklists are implementation gates, not claims that work has been completed. Market sizing and pricing are hypotheses, not forecasts.

## Agent handoff
Use `BuildPrompt.md` for the folder-level brief and `FeaturePrompts.md` for the per-file prompts. That gives OpenCode or Claude Code agents a clean route from strategy to execution without inventing missing context.

For a single entry point, start with `OPENCODE_MASTER_PROMPT.md`.

## Source anchors
- [AISHE 2021–22](https://aishe.gov.in/document/aishe-final-report-2021-22/) reports nearly 4.33 crore higher-education enrolments.
- [NEP 2020](https://www.education.gov.in/sites/upload_files/mhrd/files/NEP_Final_English.pdf) and the [UGC CCFUP initiative](https://www.ugc.gov.in/KeyInitiative?ID=yiPY1rgAlvz9%2F1chFf86gg%3D%3D) inform the outcome-based positioning.
- [Digital Personal Data Protection Act, 2023](https://www.indiacode.nic.in/indiacode/handle/123456789/22037?view_type=browse) informs privacy controls; obtain legal advice before launch.

## Decision log
1. Build the Academic Knowledge Engine before broad feature expansion.
2. Use assessment creation as the wedge, not the company definition.
3. Build deterministic planning, validation, approval and evidence around replaceable foundation models.
4. Sell institution-level workflow and compliance outcomes, not faculty time savings alone.
5. Expand only after one repeatable engineering-college segment shows measurable administrative and quality improvement.
