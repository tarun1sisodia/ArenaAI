---
name: technical-writing
description: Produce precise, structured writing for technical or academic purposes. Use when presenting a Markdown report, article, analysis, or other long-form written document to the user.
---

# Technical Writing

## When to Use

- When writing a report, multi-chapter article, analysis, or other long-form document as a deliverable for the user
- When presenting research findings, factual claims, or external data in Markdown
- When the task requires precise, structured writing for technical or academic purposes

## Technical Writing Best Practices

- MUST strictly follow the format instructions below
- MUST organize reports and concept explanations from the overall conclusion to supporting details; apply the same general-to-specific order within sections and list items
- MUST keep syntax and logic unnested; present one reasoning step at a time
- MUST express one main proposition per sentence and avoid mixing definitions, facts, judgments, examples, exceptions, or recommendations
- MUST not assume unstated reader knowledge; define specialized terms, expand abbreviations, and state necessary premises
- Use plain, direct, concise, and information-dense language; remove filler and make logical relationships explicit
- Avoid unnecessary metaphors and analogies; use literal explanations by default and state the limits of an analogy when one is necessary
- MUST include a "References" section at the end using Markdown reference definitions
- MUST use one numeric reference ID end-to-end: cite as `[1]` and define every source as `[1]: https://example.com "Descriptive source title"`; the double-quoted page, article, report, or video title is required—never output a bare URL, append an unquoted title, place prose before the URL, use alias IDs such as `r1`, full-reference forms such as `[1][r1]`, nested inline links, or custom HTML anchors
- When citing multiple sources, separate each complete citation with a space (e.g., `[1] [2]`); never concatenate them as `[1][2]`
- Use Markdown blockquotes to quote full passages from sources, with clear attribution
- MUST include well-structured tables to organize key information wherever applicable
- Actively insert charts and images when needed to support analysis or convey insights
- MUST save data visualizations to image files first, then insert them into documents using Markdown syntax
- NEVER deliver intermediate notes as final result; MUST rewrite into information-rich but readable final document
- MUST avoid using excessive bullet points; instead, write in full sentences and paragraphs
- DO NOT convert documents to PDF unless explicitly requested by the user
- Default author is **Manus AI**, unless the user specifies otherwise
- Take pride in your work and aim to exceed user expectations

## Format

- Use GitHub-flavored Markdown as the default format for all messages and documents unless otherwise specified
- MUST write in a professional, academic style, using complete paragraphs rather than bullet points
- Alternate between well-structured paragraphs and tables, where tables are used to clarify, organize, or compare key information
- Use **bold** text for emphasis on key concepts, terms, or distinctions where appropriate
- Use blockquotes to highlight definitions, cited statements, or noteworthy excerpts
- Use inline hyperlinks when mentioning a website or resource for direct access
- Use inline numeric citations with Markdown reference-style links for factual claims
- Use Markdown pipe tables only; never use HTML `<table>` in Markdown files
- MUST avoid using emoji unless absolutely necessary, as it is not considered professional

## Final Rewrite

You must rewrite the final version of the document; everything written up to this point is only a draft.

- NEVER deliver intermediate notes as the only result; MUST prepare information-rich but readable final versions
- When delivering key files (e.g., reports), MUST keep message text concise and guide the user to view the attachments directly
