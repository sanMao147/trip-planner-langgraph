"use client";

export function useExport() {
  const exportAsPNG = async (elementId: string, filename = "trip-plan") => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element #${elementId} not found`);
      return;
    }

    // 动态导入 html2canvas，按需加载 ~150KB
    const { default: html2canvas } = await import("html2canvas");

    const canvas = await html2canvas(element, {
      backgroundColor: "#0A1628",
      scale: 2,
      useCORS: true,
    });

    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const exportAsPDF = async (elementId: string, filename = "trip-plan") => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element #${elementId} not found`);
      return;
    }

    // 动态导入导出库，按需加载 ~200KB
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const canvas = await html2canvas(element, {
      backgroundColor: "#0A1628",
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width / 2, canvas.height / 2],
    });

    pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`${filename}.pdf`);
  };

  return { exportAsPNG, exportAsPDF };
}
