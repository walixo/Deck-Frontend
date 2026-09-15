const fs = require('node:fs');
const path = require('node:path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  TableOfContents, PageBreak, LevelFormat, PositionalTab,
  PositionalTabAlignment, PositionalTabLeader,
} = require('docx');
const { meta, sections } = require('./content.js');

/* Deck's palette, so the document is recognisably the same product. */
const INK = '111111';
const POP = 'B8A9FA';
const DEEP = '2A2440';
const MUTED = '55534E';
const RULE = 'D8D6CE';

const PAGE = { width: 12240, height: 15840 }; // US Letter, DXA

const body = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: 160, line: 300 },
    children: [new TextRun({ text, size: 21, color: opts.muted ? MUTED : INK })],
  });

const rule = () =>
  new Paragraph({
    spacing: { after: 240 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: INK } },
    children: [],
  });

/** Term/description rows. A table, because a two-column fact list is a table. */
const factTable = (rows) =>
  new Table({
    columnWidths: [2600, 6600],
    width: { size: 9200, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: rows.map(
      ([term, description]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 2600, type: WidthType.DXA },
              margins: { top: 90, bottom: 90, left: 0, right: 140 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: term.toUpperCase(), bold: true, size: 17, color: INK }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 6600, type: WidthType.DXA },
              margins: { top: 90, bottom: 90, left: 0, right: 0 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: description, size: 20, color: MUTED })],
                }),
              ],
            }),
          ],
        }),
    ),
  });

const children = [];

/* ------------------------------------------------------------------ cover */
children.push(
  new Paragraph({
    spacing: { before: 2400, after: 120 },
    children: [
      new TextRun({ text: 'BUILD HANDBOOK', bold: true, size: 18, color: MUTED, characterSpacing: 60 }),
    ],
  }),
  new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: 'DECK', bold: true, size: 96, color: INK })],
  }),
  rule(),
  new Paragraph({
    spacing: { after: 400 },
    children: [new TextRun({ text: meta.subtitle, size: 24, color: MUTED })],
  }),
  factTable(meta.facts),
  new Paragraph({
    spacing: { before: 400 },
    children: [
      new TextRun({
        text: `Generated ${new Date().toISOString().slice(0, 10)}`,
        size: 17,
        color: MUTED,
      }),
    ],
  }),
  new Paragraph({ children: [new PageBreak()] }),
);

/* -------------------------------------------------------------- contents */
children.push(
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 240 },
    children: [new TextRun({ text: 'Contents', bold: true, size: 32, color: INK })],
  }),
);
sections.forEach((section, i) => {
  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: `${i + 1}. ${section.title}`, size: 21, color: INK }),
        new TextRun({
          children: [
            new PositionalTab({
              alignment: PositionalTabAlignment.RIGHT,
              leader: PositionalTabLeader.DOT,
              relativeTo: 'margin',
            }),
          ],
        }),
      ],
    }),
  );
});
children.push(new Paragraph({ children: [new PageBreak()] }));

/* -------------------------------------------------------------- sections */
sections.forEach((section, i) => {
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 320, after: 60 },
      children: [
        new TextRun({ text: `${i + 1} · `, bold: true, size: 30, color: POP }),
        new TextRun({ text: section.title, bold: true, size: 30, color: INK }),
      ],
    }),
    rule(),
  );

  for (const paragraph of section.body ?? []) children.push(body(paragraph));

  if (section.bullets) {
    children.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
    children.push(factTable(section.bullets));
  }
});

const doc = new Document({
  creator: 'Deck',
  title: meta.title,
  description: meta.subtitle,
  styles: {
    default: {
      document: { run: { font: 'Aptos', size: 21, color: INK } },
      heading1: { run: { font: 'Aptos Display', bold: true, color: INK } },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: PAGE,
          margin: { top: 1080, right: 1440, bottom: 1080, left: 1440 },
        },
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(path.resolve(__dirname, '../../Deck-Handbook.docx'), buffer);
  console.log('wrote Deck-Handbook.docx', (buffer.length / 1024).toFixed(0) + 'KB');
});
