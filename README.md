# DoneCheck

**Open-source verification infrastructure for AI-generated work.**

DoneCheck helps determine whether an AI-generated result actually satisfies the original task, measurable success criteria, and required evidence before a human accepts it as complete.

## The problem

AI systems can produce outputs that look complete while still missing requirements, evidence, or the user's original intent. As agents work for longer periods and perform more complex tasks, a simple "completed" status is not enough.

DoneCheck is designed to make completion claims transparent, inspectable, and reviewable.

Core flow:

`task → success criteria → AI-generated output → evidence → verification → human review → accepted / revise / rejected`

## Open-source purpose

DoneCheck Core is intended to be free, public, and reusable open-source infrastructure.

The goal is to provide developers and researchers with a lightweight verification layer that can be integrated into different AI and agent systems while preserving final human judgment.

Planned core capabilities include:

- task and success-criteria schemas
- evidence requirements
- automated verification checks
- transparent verification results
- human review states
- accept / revise / reject workflows
- automated tests
- public technical documentation
- a lightweight reference web application
- a reusable open-source package

## 3-month roadmap

### Month 1 — Verification contract and core architecture

- Define the task, success-criteria, evidence, and verification contracts
- Design the core data model and state transitions
- Build the first verification engine skeleton
- Publish initial technical documentation and examples

### Month 2 — Evidence, review, and reference implementation

- Implement evidence checks and verification outcomes
- Add human review, acceptance, revision, and rejection states
- Build a lightweight reference web application
- Add automated tests and example workflows

### Month 3 — Validation and public release

- Test the core against representative AI-generated tasks
- Improve reliability, documentation, and developer ergonomics
- Publish reusable integration examples
- Prepare the first public open-source release of DoneCheck Core

## Success criteria

The first public release will be considered successful when an independent developer can:

1. define a task,
2. attach measurable success criteria,
3. submit an AI-generated result and supporting evidence,
4. receive a transparent verification outcome, and
5. complete a human accept / revise / reject decision.

## Public value

DoneCheck aims to improve AI reliability and accountability by making AI-generated work more verifiable, inspectable, and easier to review.

It is designed as public infrastructure: free to use, open to inspection, and extendable by developers and researchers.

## Project status

**Pre-MVP / active development.**

The repository currently defines the public project scope and three-month implementation roadmap. Code and reference implementation work will follow in the open.

## License

DoneCheck is licensed under the **Apache License 2.0**.

This allows broad use, modification, and distribution while preserving the license and notice requirements defined in the repository's [`LICENSE`](./LICENSE) file.

## Contributing

Early feedback on the verification contract, success-criteria model, evidence model, and developer experience is welcome.
