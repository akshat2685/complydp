# ADR-0002: Use PostgreSQL Relational Tables for Privacy Graph

## Status
Accepted

## Context
Privacy management requires modeling relationships between:
`Data Token → Data Category → Processing Activity → Purpose → System/Asset → Vendor/Processor → Control → Evidence`.
While this relationship represents a graph, specialized graph databases (such as Neo4j) introduce additional operational burdens, separate backup/recovery systems, and lack native integration with SQL transactional workflows.

## Decision
We model the Privacy Graph directly inside PostgreSQL using relational foreign keys and normalized join entities:
- `personal_data_fields`
- `processing_activities`
- `processing_purposes`
- `processing_assets`
- `processing_vendors`
- `data_flows`

The user interface exposes this model as a hybrid: structured tabular views are primary for operational case work, with contextual visual graph diagrams rendered on-demand.

## Consequences
- **Positive**: Standard ACID transactions, robust foreign-key integrity, predictable relational query planners, zero additional infrastructure dependencies.
- **Negative**: Recursive deep traversal queries beyond 5 levels require standard recursive Common Table Expressions (CTEs), which are well-supported in modern PostgreSQL 16+.
