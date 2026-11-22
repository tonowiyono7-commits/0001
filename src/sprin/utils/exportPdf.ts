import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

async function waitForImages(container: HTMLElement): Promise<void> {
  const imgs = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    imgs.map(async (img) => {
      if (!img.complete) {
        await new Promise<void>((resolve) => {
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        });
      }
      if (typeof img.decode === 'function') {
        try {
          await img.decode();
        } catch {
          // ignore decode error and proceed
        }
      }
    })
  );
}

export async function exportSprinToPdf(
  container: HTMLElement,
  nomorSprin: string
): Promise<number> {
  const sheets = Array.from(container.querySelectorAll<HTMLElement>('.letter-paper'));
  if (sheets.length === 0) {
    throw new Error('Tidak ada halaman surat yang siap dicetak ke PDF.');
  }

  await waitForImages(container);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  for (let i = 0; i < sheets.length; i += 1) {
    const sheet = sheets[i];
    const width = sheet.offsetWidth || 794;
    const height = sheet.offsetHeight || 1123;

    const pngDataUrl = await toPng(sheet, {
      pixelRatio: 2.2,
      backgroundColor: '#ffffff',
      width,
      height,
      skipFonts: true,
      cacheBust: false,
      filter: (node) => {
        if (node instanceof HTMLElement && node.classList.contains('no-print')) {
          return false;
        }
        return true;
      },
      style: {
        margin: '0',
        boxShadow: 'none',
        transform: 'none',
      },
    });

    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }
    pdf.addImage(pngDataUrl, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
  }

  const safeName = nomorSprin.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  pdf.save(`${safeName || 'Surat_Perintah'}.pdf`);
  return sheets.length;
}
