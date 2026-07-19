---
id: surat-format-decision
title: Format Nomor Surat untuk Pelimpahan ke Polres/Brimob/Polair
category: decision
status: active
created: "2026-07-18T21:46:21"
updated: "2026-07-18T21:50:05"
---

## compiled_truth

## compiled_truth

Tiga doc type baru untuk DOC_TEMPLATES:

| Doc Type | Template | Keterangan |
|----------|----------|------------|
| \surat\ | \R/{no}/{rom}/{thn}/{unit}\ | Dokumen pelimpahan ke Polres/Brimob/Polair. Kode klasifikasi (misal HUK.12.10.) ditulis manual, tidak di template. |
| \sprin_henti\ | \Sprinhenti/{no}/{rom}/{thn}/{unit}\ | Sprin Henti Lidik ? ikut pola sprinlidik (Sprinlidik/{no}/{rom}/{thn}/{unit}). |
| \str_jukrah\ | \STR/{no}/{rom}/{thn}/{unit}\ | STR Jukrah ? kode klasifikasi (misal HUK.7.7.) ditulis manual seperti surat. |

## timeline

- time: 2026-07-18T12:00:00
  kind: decision
  summary: sprin_henti ikut format sprin ? Sprinhenti/{no}/{rom}/{thn}/{unit}
  source: user confirmation
- time: 2026-07-18T12:00:00
  kind: decision
  summary: str_jukrah template STR/{no}/{rom}/{thn}/{unit}, kode klasifikasi manual
  source: user example STR/123/VII/HUK.7.7./2026


## timeline

- time: 2026-07-18T12:00:00
  kind: decision
  summary: User confirmed surat format via example R/    /VII/HUK.12.10./2026/Bidpropam
  source: user message


## timeline

- time: 2026-07-18T21:46:21
  kind: decision
  summary: "Created this page: Format Nomor Surat untuk Pelimpahan ke Polres/Brimob/Polair"
  source: user confirmation via chat
  affects: [surat-format-decision]

- time: 2026-07-18T21:46:26
  kind: decision
  summary: Initial compiled truth from user confirmation
  source: brain update-truth
  affects: [surat-format-decision]

- time: 2026-07-18T21:48:24
  kind: decision
  summary: "Template surat: R/{no}/{rom}/{thn}/{unit}. HUK.12.10. adalah kode klasifikasi surat yang ditulis manual, bukan bagian template"
  source: user clarification
  affects: [surat-format-decision]

- time: 2026-07-18T21:48:26
  kind: decision
  summary: Added sprin_henti and str_jukrah formats
  source: brain update-truth
  affects: [surat-format-decision]

- time: 2026-07-18T21:50:05
  kind: decision
  summary: "Template sprin_henti=Sprinhenti/{no}/{rom}/{thn}/{unit}, str_jukrah=STR/{no}/{rom}/{thn}/{unit}"
  source: user confirmation
  affects: [surat-format-decision]
