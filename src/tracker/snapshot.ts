import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

export async function capturePng(node: HTMLElement) {
  await document.fonts.ready;
  return toPng(node, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
    width: node.scrollWidth,
    height: node.scrollHeight,
    style: {
      position: "static",
      transform: "none",
      left: "0",
      right: "auto",
      margin: "0 auto",
    },
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image"));
    image.src = src;
  });
}

export async function pngToPdfBlob(dataUrl: string) {
  const image = await loadImage(dataUrl);
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageHeight = (image.height * pageWidth) / image.width;
  let left = imageHeight;
  let position = 0;
  pdf.addImage(dataUrl, "PNG", 0, position, pageWidth, imageHeight);
  left -= pageHeight;
  while (left > 8) {
    position = left - imageHeight;
    pdf.addPage();
    pdf.addImage(dataUrl, "PNG", 0, position, pageWidth, imageHeight);
    left -= pageHeight;
  }
  return pdf.output("blob");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export async function shareFile(blob: Blob, filename: string, title: string) {
  const file = new File([blob], filename, { type: blob.type || "application/octet-stream" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return "shared" as const;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled" as const;
    }
  }
  downloadBlob(blob, filename);
  return "saved" as const;
}
