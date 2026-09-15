const fs = require('node:fs');
const path = require('node:path');
const PDFDocument = require('pdfkit');
const { meta, sections } = require('./content.js');

/*
 * The handbook as a PDF, drawn rather than converted.
 *
 * LibreOffice is not installed on this machine, so the usual DOCX→PDF path is
 * unavailable — but drawing it directly is the better outcome anyway: the PDF
 * gets Deck's actual typefaces, converted out of the same @fontsource packages
 * the site loads, rather than whatever an office suite substitutes.
 */
/* Anchored to this file, not the working directory — `npm run handbook` from
   the repository root used to fail on the font paths. */
const HERE = __dirname;
const OUT = path.resolve(HERE, '../../Deck-Handbook.pdf');

const INK = '#111111';
const POP = '#b8a9fa';
const MUTED = '#55534e';
const RULE = '#d8d6ce';

const M = 64;                       // page margin
const doc = new PDFDocument({ size: 'LETTER', margin: M, autoFirstPage: false, bufferPages: true,
  info: { Title: meta.title, Author: 'Deck', Subject: meta.subtitle } });

doc.registerFont('display', path.join(HERE, 'fonts/ArchivoBlack.ttf'));
doc.registerFont('body', path.join(HERE, 'fonts/Geist.ttf'));
doc.registerFont('mono', path.join(HERE, 'fonts/GeistMono.ttf'));

const W = doc.page ? doc.page.width : 612;
const CONTENT = 612 - M * 2;

const out = fs.createWriteStream(OUT);
doc.pipe(out);

let pageNo = 0;

/*
 * Footers are stamped at the end, over the buffered pages.
 *
 * Two earlier attempts were wrong in instructive ways. Numbering only inside a
 * `newPage` helper missed the pages pdfkit adds by itself when text overflows —
 * it reported 18 for a 35-page document, and seventeen pages had no number.
 * Drawing from a `pageAdded` listener fixed the count and then blew the stack,
 * because writing text during `addPage` re-enters pagination.
 *
 * `bufferPages` holds every page open until `flushPages`, so the footer can be
 * written once per page after all the content exists — which is also the only
 * point at which the total is known.
 */
function newPage() {
  doc.addPage();
}

function stampFooters() {
  const range = doc.bufferedPageRange();
  const total = range.count;

  for (let i = range.start; i < range.start + total; i += 1) {
    doc.switchToPage(i);
    /* The cover carries no furniture. */
    if (i === range.start) continue;

    /*
     * The footer sits below the bottom margin, and pdfkit treats writing there
     * as an overflow — it silently adds a page per footer. An earlier version
     * of this produced 35 pages for 18 pages of content, every other one blank.
     * Dropping the bottom margin for the write is the documented way out.
     */
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    const y = 792 - M + 22;
    doc.font('mono').fontSize(7.5).fillColor(MUTED);
    doc.text('DECK — BUILD HANDBOOK', M, y, { lineBreak: false });
    doc.text(`${i - range.start + 1} / ${total}`, M, y, {
      width: CONTENT,
      align: 'right',
      lineBreak: false,
    });

    doc.page.margins.bottom = bottom;
  }

  pageNo = total;
}

/**
 * Breaks before the footer band rather than into it.
 *
 * pdfkit's own margin is the page margin; the footer sits inside it, so a block
 * that fits by pdfkit's reckoning can still land on top of the page number.
 * This reserves that band explicitly.
 */
const FLOOR = 792 - M - 34;

function ensure(height) {
  if (doc.y + height > FLOOR) newPage();
}

function rule(colour = INK, weight = 2) {
  const y = doc.y;
  doc.save().lineWidth(weight).strokeColor(colour)
    .moveTo(M, y).lineTo(M + CONTENT, y).stroke().restore();
  doc.y = y + 14;
}

function para(text, { size = 10, colour = INK, gap = 11 } = {}) {
  doc.font('body').fontSize(size).fillColor(colour);
  const height = doc.heightOfString(text, { width: CONTENT, lineGap: 3.2 });

  /* Measured up front so a paragraph either fits or starts a new page — never
     spills across the footer and then continues. */
  ensure(height);
  doc.text(text, M, doc.y, { width: CONTENT, align: 'left', lineGap: 3.2, height: FLOOR - doc.y });
  doc.y += gap;
}

/** Two-column term/description rows with hairlines, matching the DOCX. */
function facts(rows) {
  const termW = 132;
  const descW = CONTENT - termW - 16;

  for (const [term, description] of rows) {
    doc.font('body').fontSize(9.5);
    const h = Math.max(
      doc.heightOfString(description, { width: descW, lineGap: 2.6 }),
      12,
    ) + 15;
    ensure(h + 6);

    const top = doc.y;
    doc.save().lineWidth(0.75).strokeColor(RULE)
      .moveTo(M, top).lineTo(M + CONTENT, top).stroke().restore();

    doc.font('mono').fontSize(7.6).fillColor(INK)
      .text(term.toUpperCase(), M, top + 8, { width: termW, lineBreak: true });
    doc.font('body').fontSize(9.5).fillColor(MUTED)
      .text(description, M + termW + 16, top + 7, { width: descW, lineGap: 2.6 });

    doc.y = top + h;
  }

  doc.save().lineWidth(0.75).strokeColor(RULE)
    .moveTo(M, doc.y).lineTo(M + CONTENT, doc.y).stroke().restore();
  doc.y += 16;
}

/* ------------------------------------------------------------------ cover */
newPage();
doc.y = 150;
doc.font('mono').fontSize(9).fillColor(MUTED)
  .text('BUILD HANDBOOK', M, doc.y, { characterSpacing: 2.2 });
doc.y += 14;
doc.font('display').fontSize(78).fillColor(INK).text('DECK', M, doc.y, { characterSpacing: -2 });
doc.y += 16;
rule(INK, 3);
doc.font('body').fontSize(12.5).fillColor(MUTED)
  .text(meta.subtitle, M, doc.y, { width: CONTENT - 60, lineGap: 4 });
doc.y += 30;
facts(meta.facts);
doc.font('mono').fontSize(8).fillColor(MUTED)
  .text(`GENERATED ${new Date().toISOString().slice(0, 10)}`, M, doc.y);

/* -------------------------------------------------------------- contents */
newPage();
doc.font('display').fontSize(24).fillColor(INK).text('CONTENTS', M, doc.y);
doc.y += 8;
rule();
sections.forEach((section, i) => {
  ensure(20);
  doc.font('body').fontSize(10.5).fillColor(INK)
    .text(`${i + 1}.  ${section.title}`, M, doc.y, { width: CONTENT });
  doc.y += 5;
});

/* -------------------------------------------------------------- sections */
sections.forEach((section, i) => {
  newPage();
  doc.font('display').fontSize(9).fillColor(POP).text(`${i + 1}`, M, doc.y);
  doc.y -= 2;
  doc.font('display').fontSize(23).fillColor(INK)
    .text(section.title.toUpperCase(), M, doc.y, { width: CONTENT, characterSpacing: -0.4 });
  doc.y += 8;
  rule();

  for (const paragraph of section.body ?? []) para(paragraph);
  if (section.bullets) {
    doc.y += 2;
    facts(section.bullets);
  }
});

stampFooters();
doc.flushPages();
doc.end();

out.on('finish', () => {
  const size = fs.statSync(OUT).size;
  console.log(`wrote Deck-Handbook.pdf ${(size / 1024).toFixed(0)}KB · ${pageNo} pages`);
});
