import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

import { requireRole } from "@/lib/auth";
import { siteUrl } from "@/lib/env";

/**
 * The Table QR sheet — story 2.5, and UJ-1's climax.
 *
 * This is the moment the product stops being a website and becomes a physical
 * object the owner tapes to a table, so it has to print properly on the office
 * printer: A4, codes at least 4cm square, the restaurant's own name above them.
 */

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 42; // ~15mm
const CODE = 150; // ~5.3cm, comfortably over the 4cm floor
const COLUMNS = 3;
const ROWS = 4;
const PER_PAGE = COLUMNS * ROWS;

export async function GET(request: Request) {
  const me = await requireRole("owner");

  const requested = Number(new URL(request.url).searchParams.get("tables"));
  const tables = Number.isInteger(requested)
    ? Math.min(Math.max(requested, 1), 100)
    : 12;

  const pdf = await PDFDocument.create();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);

  const cellWidth = (A4.width - MARGIN * 2) / COLUMNS;
  const cellHeight = (A4.height - MARGIN * 2 - 40) / ROWS;

  for (let start = 0; start < tables; start += PER_PAGE) {
    const page = pdf.addPage([A4.width, A4.height]);

    page.drawText(me.restaurant.name, {
      x: MARGIN,
      y: A4.height - MARGIN,
      size: 16,
      font: bold,
      color: rgb(0.086, 0.094, 0.114), // ink-primary
    });

    page.drawText("Scan to see the menu and order", {
      x: MARGIN,
      y: A4.height - MARGIN - 18,
      size: 9,
      font: regular,
      color: rgb(0.357, 0.384, 0.439), // ink-secondary
    });

    for (let slot = 0; slot < PER_PAGE && start + slot < tables; slot++) {
      const table = start + slot + 1;
      const column = slot % COLUMNS;
      const row = Math.floor(slot / COLUMNS);

      const url = `${siteUrl()}/r/${me.restaurant.slug}?table=${table}`;

      const png = await QRCode.toBuffer(url, {
        type: "png",
        width: 600,
        margin: 1,
        errorCorrectionLevel: "M",
      });

      const image = await pdf.embedPng(png);

      const cellLeft = MARGIN + column * cellWidth;
      const cellTop = A4.height - MARGIN - 40 - row * cellHeight;

      page.drawImage(image, {
        x: cellLeft + (cellWidth - CODE) / 2,
        y: cellTop - CODE,
        width: CODE,
        height: CODE,
      });

      const label = `Table ${table}`;
      const labelWidth = bold.widthOfTextAtSize(label, 12);

      page.drawText(label, {
        x: cellLeft + (cellWidth - labelWidth) / 2,
        y: cellTop - CODE - 18,
        size: 12,
        font: bold,
        color: rgb(0.086, 0.094, 0.114),
      });
    }
  }

  const bytes = await pdf.save();
  const filename = `${me.restaurant.slug}-table-codes.pdf`;

  return new Response(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
