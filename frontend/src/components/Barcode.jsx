import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

/**
 * Renders a real, scannable Code 128 barcode from any string value.
 * Uses an inline <svg> so it scales crisply for printing on shipping labels.
 *
 * Props:
 *   value     string  — the data the barcode encodes (e.g. order number).
 *   format    string  — defaults to 'CODE128' (alphanumeric, courier-friendly).
 *                       Other useful options: 'CODE39', 'EAN13', 'ITF14'.
 *   height    number  — bar height in px (default 60). 50–80 is a good range
 *                       for a 4×6 shipping label.
 *   width     number  — width of a single thinnest bar (default 1.6 — finer
 *                       lines fit more digits per inch when printed).
 *   showText  bool    — render the encoded value below the bars (default true).
 *   className string  — extra wrapper classes.
 */
export default function Barcode({
  value,
  format = 'CODE128',
  height = 60,
  width = 1.6,
  showText = true,
  className = '',
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, String(value), {
        format,
        height,
        width,
        displayValue: showText,
        fontSize: 12,
        margin: 0,
        background: '#ffffff',
        lineColor: '#000000',
      });
    } catch (err) {
      // JsBarcode throws on incompatible chars (e.g. non-numeric in EAN13).
      // We fail soft so the label still renders without crashing the page.
      console.warn('Barcode render error:', err.message);
    }
  }, [value, format, height, width, showText]);

  return (
    <div className={`flex justify-center ${className}`}>
      <svg ref={ref} aria-label={`Barcode for ${value}`} />
    </div>
  );
}
