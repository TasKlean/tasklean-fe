/**
 * Draws an encoded QR code. Ink and paper do not follow the colour scheme: a
 * camera reads dark modules on a light field, whichever scheme is on.
 */

import type { QrCode } from "@/lib/qr/qr-code/qr-code.types";

type QrImageProps = {
  code: QrCode;
  // What the code is for. The image itself says nothing to a screen reader.
  label: string;
};

/** Renders a QR code as an SVG that scales with its box. */
export function QrImage({ code, label }: Readonly<QrImageProps>) {
  return (
    <svg
      viewBox={`0 0 ${code.size} ${code.size}`}
      role="img"
      aria-label={label}
      // Without it the browser blurs the module edges and some scanners miss.
      shapeRendering="crispEdges"
      className="bg-qr-paper size-44 shrink-0 rounded-md p-1.5 sm:size-52"
    >
      <path d={code.path} className="fill-qr-ink" />
    </svg>
  );
}
