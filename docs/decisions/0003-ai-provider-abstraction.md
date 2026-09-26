# ADR-0003: AI Behind Strict Provider Abstraction with Human Review

## Status
Accepted

## Context
AI provides powerful acceleration for classifying cookies, parsing code tokens, identifying vendors, and inferring processing activities. However, in legal and regulatory contexts such as the DPDP Act, an AI model cannot be allowed to silently make authoritative compliance determinations or alter the baseline without human oversight. Furthermore, direct vendor lock-in to proprietary LLM endpoints limits deployment flexibility for enterprise clients requiring localized Indian cloud hosting.

## Decision
1. All AI capabilities are isolated behind an `IAIProvider` interface in `packages/ai`. Domain code calls task-specific functions (e.g., `classifyPersonalData()`), never raw LLM APIs directly.
2. Every AI output must produce an `AIResult` contract containing:
   - Unique ID
   - Task type & input reference
   - Model name & version
   - Output payload
   - Confidence percentage
   - Evidence references
   - Review status (`SUGGESTED`, `ACCEPTED`, `REJECTED`, `MODIFIED`)
   - Reviewer identity & review timestamp
3. AI outputs are treated as suggestions that transition to authoritative operational facts only upon explicit human DPO/analyst review.

## Consequences
- **Positive**: Strict regulatory defensibility, zero silent hallucinations altering compliance status, vendor independence (easy to swap between OpenAI, Anthropic, or on-premise open-weights models).
- **Negative**: Requires workflow state machines and UI approval bars for each AI-generated suggestion.
