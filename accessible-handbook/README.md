# Accessible CRJU Undergraduate Handbook Source

This directory contains the maintainable Markdown edition of the **Fall 2026 Criminal Justice Undergraduate Advising Handbook**. The original Word file remains unchanged one directory above.

## Source and outputs

- `handbook.md` is the canonical editorial source.
- `assets/` contains the approved Criminal Justice and Cal State Fullerton marks.
- `build/crju-undergraduate-handbook-fa26.pdf` is produced with `templates/accessible-handbook.latex`, a handbook-specific derivative of the PDF/UA-oriented template in the sibling `accessible_handouts` repository. The derivative adds generated-TOC support and Pandoc 3.10 long-table compatibility.
- `build/crju-undergraduate-handbook-fa26-editable.docx` is the faculty-editable Word edition.
- `build/crju-undergraduate-handbook-fa26.html` is a standalone semantic HTML edition.

The Markdown deliberately omits the Word document's manual page-numbered table of contents. Each output receives a generated table of contents from its actual heading structure.

## Build

Requirements: Pandoc 3.x, LuaLaTeX, GNU Make, Python 3, and `python-docx`. The adapted accessibility template is kept locally so the build is self-contained.

```sh
cd /home/dadams/Repos/crju-handbook/accessible-handbook
make all
```

Individual targets are `make pdf`, `make docx`, `make html`, and `make check`. Run `make validate` for the source checks plus formal veraPDF PDF/UA-1 validation.

The four road-map sections are print-oriented worksheets: PDF and DOCX place them on landscape pages, and each sample or blank planning matrix begins on a new page. The Word builder also applies readable Arial typography, one-inch portrait margins, 0.75-inch landscape margins, repeated table headers, and page numbers.

The DOCX build removes split/merged cells, simulated underscore fields, and simulated footnotes; gives every hyperlink a descriptive label and LibreOffice-readable Name; and applies a high-contrast link color. These conditions are enforced by structural checks inside `scripts/build_docx.py` on every Word build.

## Editing workflow

Edit `handbook.md` whenever possible, then rebuild all formats. Markdown headings are semantic: use one `#` for a major section, `##` for its subsection, and `###` only beneath an existing second-level heading. Do not use empty headings or heading levels for visual sizing.

Images require meaningful alternative text unless they are intentionally decorative. The primary department logo is supplied through document metadata for PDF and as a described source image for DOCX/HTML, with the alternative text “Cal State Fullerton Department of Criminal Justice.”

Faculty can edit the generated DOCX. To bring a revised Word copy back toward Markdown without overwriting the maintained source:

```sh
make reimport DOCX_IN=/absolute/path/to/faculty-revision.docx
```

This creates `build/reimported.md`. Review its changes against `handbook.md` and merge them manually; Word cannot preserve every Markdown structural choice through a round trip.

## Accessibility notes

The conversion repairs structural issues inherited from the original Word file, including false block quotations, headings at levels 7 and 8, duplicated/decorative images, generic automatic alt text, a stale manual table of contents, and Outlook Safe Links. Tables retain header rows where the source identifies them.

The source checks are useful but are not a substitute for final-format review. Before publishing, run a PDF/UA validator such as veraPDF, inspect the Word Accessibility Checker results, test keyboard navigation in the HTML edition, and spot-check reading order with a screen reader.

## Content review flags

The conversion preserves source wording, including apparent content inconsistencies. Before publication, faculty should verify all TBD contact details, displayed email addresses against their actual `mailto:` targets, current program requirements, faculty assignments, and external links.

See `../MEMO-ackerman-items-to-verify.md` for the content discrepancies already identified during the website conversion.
