# Payslip fonts

Noto Sans (Regular + Bold), vendored from the Google Fonts release.

They are here rather than in `node_modules` because PDF/A (ISO 19005) requires every
font used by a document to be embedded in it, so the payslip renderer needs the actual
outlines at run time — the standard PDF Helvetica is referenced, not embedded, and its
WinAnsi encoding has no glyph for the rupee sign an Indian payslip is mostly made of.

Licensed under the SIL Open Font License 1.1: https://openfontlicense.org
