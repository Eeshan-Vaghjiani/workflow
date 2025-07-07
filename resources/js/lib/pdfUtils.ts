import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';

// Define types for better type safety
export interface TableData {
    title: string;
    head: string[][];
    body: (string | number)[][];
    styles?: {
        headStyles?: {
            fillColor?: number[];
            textColor?: number;
        };
        alternateRowStyles?: {
            fillColor?: number[];
        };
    };
}

export interface ChartData {
    title: string;
    imageData: string;
    width: number;
    height: number;
}

export interface PDFOptions {
    fileName: string;
    reportTitle: string;
    tables?: TableData[];
    charts?: ChartData[];
    orientation?: 'portrait' | 'landscape';
    pageSize?: 'a4' | 'letter' | 'legal';
}

/**
 * Generates and downloads a PDF report with tables and/or charts
 * @param options Configuration options for the PDF report
 */
export const generatePDFReport = async (options: PDFOptions): Promise<void> => {
    try {
        const {
            fileName,
            reportTitle,
            tables = [],
            charts = [],
            orientation = 'portrait',
            pageSize = 'a4'
        } = options;

        // Create PDF document
        const doc = new jsPDF({
            orientation,
            unit: 'mm',
            format: pageSize
        });

        // Add report title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        const title = reportTitle;
        const titleWidth = doc.getStringUnitWidth(title) * 18 / doc.internal.scaleFactor;
        const titleX = (doc.internal.pageSize.getWidth() - titleWidth) / 2;
        doc.text(title, titleX, 20);

        // Add timestamp
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        let currentY = 40;

        // Add tables
        for (const table of tables) {
            // Add table title
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');

            // Check if we need a new page
            if (currentY > doc.internal.pageSize.getHeight() - 40) {
                doc.addPage();
                currentY = 20;
            }

            doc.text(table.title, 14, currentY);
            currentY += 10;

            try {
                // Add table with proper type casting
                (doc as any).autoTable({
                    head: table.head,
                    body: table.body,
                    startY: currentY,
                    theme: 'grid',
                    headStyles: {
                        fillColor: table.styles?.headStyles?.fillColor || [41, 128, 185],
                        textColor: table.styles?.headStyles?.textColor || 255,
                        fontSize: 12,
                        fontStyle: 'bold'
                    },
                    alternateRowStyles: {
                        fillColor: table.styles?.alternateRowStyles?.fillColor || [245, 247, 250]
                    },
                    margin: { top: 10 }
                });

                // Update currentY position
                currentY = (doc as any).lastAutoTable.finalY + 20;
            } catch (tableError) {
                console.error('Error generating table:', tableError);
                // Fallback to basic text representation
                table.body.forEach((row) => {
                    if (currentY > doc.internal.pageSize.getHeight() - 20) {
                        doc.addPage();
                        currentY = 20;
                    }
                    doc.setFontSize(10);
                    doc.text(row.join(' | '), 14, currentY);
                    currentY += 10;
                });
            }
        }

        // Add charts
        for (const chart of charts) {
            // Check if we need a new page
            if (currentY > doc.internal.pageSize.getHeight() - 40) {
                doc.addPage();
                currentY = 20;
            }

            // Add chart title
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(chart.title, 14, currentY);
            currentY += 10;

            try {
                // Add chart image
                doc.addImage(
                    chart.imageData,
                    'PNG',
                    14,
                    currentY,
                    chart.width,
                    chart.height
                );
                currentY += chart.height + 20;
            } catch (chartError) {
                console.error('Error adding chart:', chartError);
                doc.setFontSize(10);
                doc.setTextColor(255, 0, 0);
                doc.text('Error: Chart could not be generated', 14, currentY);
                currentY += 10;
            }
        }

        // Save the PDF
        doc.save(fileName);
    } catch (error) {
        console.error('Error generating PDF report:', error);
        throw new Error('Failed to generate PDF report. Please try again.');
    }
};

/**
 * Converts a chart element to a base64 PNG image
 * @param chartElement The chart DOM element to convert
 * @returns Promise resolving to the base64 image data
 */
export const chartToImage = async (chartElement: HTMLElement): Promise<string> => {
    try {
        const canvas = await import('html2canvas').then(html2canvas =>
            html2canvas.default(chartElement, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: '#ffffff'
            })
        );
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error('Error converting chart to image:', error);
        throw new Error('Failed to convert chart to image');
    }
};

/**
 * Simple fallback function for basic text-only PDF reports
 * @param options Basic options for the PDF report
 */
export const generateBasicPDFReport = (options: {
    fileName: string;
    reportTitle: string;
    content: { title: string; data: (string | number)[][] }[];
}): void => {
    try {
        const doc = new jsPDF();
        let yPos = 20;
        const lineHeight = 10;
        const margin = 14;

        // Add title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(options.reportTitle, margin, yPos);
        yPos += lineHeight * 2;

        // Add timestamp
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPos);
        yPos += lineHeight * 2;

        // Add content sections
        for (const section of options.content) {
            // Add section title
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');

            if (yPos > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                yPos = margin;
            }

            doc.text(section.title, margin, yPos);
            yPos += lineHeight;

            // Add data
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            section.data.forEach(row => {
                if (yPos > doc.internal.pageSize.getHeight() - margin) {
                    doc.addPage();
                    yPos = margin;
                }
                doc.text(row.join(': '), margin, yPos);
                yPos += lineHeight;
            });

            yPos += lineHeight;
        }

        doc.save(options.fileName);
    } catch (error) {
        console.error('Error generating basic PDF report:', error);
        throw new Error('Failed to generate basic PDF report');
    }
};
