"use client";

/**
 * 导出功能 Hook
 * 
 * 提供将旅行计划导出为 PNG 图片和 PDF 文件的功能。
 * 使用动态导入方式加载导出依赖，减少首屏加载体积。
 */
export function useExport() {
  /**
   * 将指定 DOM 元素导出为 PNG 图片
   * 
   * @param elementId 要导出的 DOM 元素 ID
   * @param filename 导出文件的名称（不含扩展名）
   */
  const exportAsPNG = async (elementId: string, filename = "trip-plan") => {
    try {
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

      // 创建下载链接并触发下载
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("PNG 导出失败:", error);
      throw error;
    }
  };

  /**
   * 将指定 DOM 元素导出为 PDF 文件
   * 
   * @param elementId 要导出的 DOM 元素 ID
   * @param filename 导出文件的名称（不含扩展名）
   */
  const exportAsPDF = async (elementId: string, filename = "trip-plan") => {
    try {
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
        // 根据画布宽高比决定方向
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error("PDF 导出失败:", error);
      throw error;
    }
  };

  return { exportAsPNG, exportAsPDF };
}