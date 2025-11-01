import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RowInput } from 'jspdf-autotable';

// Define types for better type safety
type Color = [number, number, number];

export interface TableData {
    title: string;
    head: string[][];
    body: RowInput[];
    styles?: {
        headStyles?: {
            fillColor?: Color;
            textColor?: number;
        };
        alternateRowStyles?: {
            fillColor?: Color;
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

export interface DownloadData {
    [section: string]: {
        [key: string]: string | number;
    };
}

interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: {
        finalY: number;
    };
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
        }) as jsPDFWithAutoTable;

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
                autoTable(doc, {
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
                currentY = doc.lastAutoTable.finalY + 20;
            } catch (tableError) {
                console.error('Error generating table:', tableError);
                // Fallback to basic text representation
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text('Could not generate table, showing raw data:', 14, currentY);
                currentY += 10;
                table.body.forEach(row => {
                    if (currentY > doc.internal.pageSize.getHeight() - 20) {
                        doc.addPage();
                        currentY = 20;
                    }
                    doc.text(Array.isArray(row) ? row.join(', ') : row.toString(), 14, currentY);
                    currentY += 7;
                });
            }
        }

        // Add charts
        for (const chart of charts) {
            // Add chart title
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');

            // Check if we need a new page for the chart
            if (currentY + chart.height > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                currentY = 20;
            }

            doc.text(chart.title, 14, currentY);
            currentY += 10;

            // Add chart image
            doc.addImage(chart.imageData, 'PNG', 14, currentY, chart.width, chart.height);
            currentY += chart.height + 20;
        }

        // Save the PDF
        doc.save(fileName);
    } catch (error) {
        console.error('Error generating PDF report:', error);
        // Fallback to a simpler, text-only report if generation fails
        const fallbackContent =
            options.tables?.map(table => ({
                title: table.title,
                data: table.body.map(row => {
                    if (!Array.isArray(row)) return []; // Should not happen with correct types, but good for safety
                    return row.map(cell => {
                        if (cell === null || cell === undefined) {
                            return '';
                        }
                        if (typeof cell === 'object' && 'content' in cell && cell.content) {
                            return Array.isArray(cell.content)
                                ? cell.content.join(' ')
                                : cell.content.toString();
                        }
                        return cell.toString();
                    });
                })
            })) || [];

        generateBasicPDFReport({
            fileName: options.fileName,
            reportTitle: `[FALLBACK] ${options.reportTitle}`,
            content: fallbackContent
        });
    }
};

/**
 * Converts a chart element to a base64 PNG image
 * @param chartElement The chart DOM element to convert
 * @returns Promise resolving to the base64 image data
 */
export const chartToImage = (chartElement: HTMLElement): Promise<string> => {
    return new Promise((resolve, reject) => {
        import('html2canvas').then(({ default: html2canvas }) => {
            // Clone the element to avoid modifying the original
            const clonedElement = chartElement.cloneNode(true) as HTMLElement;

            // Force RGB colors instead of oklch
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach(el => {
                const element = el as HTMLElement;
                if (element.style) {
                    // Convert any oklch colors to a safe RGB fallback
                    if (element.style.fill && element.style.fill.includes('oklch')) {
                        element.style.fill = 'rgb(0, 136, 122)'; // Safe fallback color
                    }
                    if (element.style.stroke && element.style.stroke.includes('oklch')) {
                        element.style.stroke = 'rgb(0, 136, 122)'; // Safe fallback color
                    }
                    if (element.style.backgroundColor && element.style.backgroundColor.includes('oklch')) {
                        element.style.backgroundColor = 'rgb(255, 255, 255)'; // Safe fallback color
                    }
                    if (element.style.color && element.style.color.includes('oklch')) {
                        element.style.color = 'rgb(0, 0, 0)'; // Safe fallback color
                    }
                }
            });

            // Create a temporary container to hold the cloned element
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '-9999px';
            tempContainer.appendChild(clonedElement);
            document.body.appendChild(tempContainer);

            html2canvas(clonedElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff' // Ensure background is not transparent
            }).then(canvas => {
                // Clean up
                document.body.removeChild(tempContainer);
                resolve(canvas.toDataURL('image/png', 1.0));
            }).catch(error => {
                // Clean up
                if (document.body.contains(tempContainer)) {
                    document.body.removeChild(tempContainer);
                }
                console.error('Error converting chart to image:', error);
                reject(new Error('Failed to convert chart to image.'));
            });
        }).catch(error => {
            console.error('Error loading html2canvas:', error);
            reject(new Error('Failed to load html2canvas.'));
        });
    });
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
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        }) as jsPDFWithAutoTable;
        let yPos = 20;
        const lineHeight = 10;
        const margin = 14;

        // Add title
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(options.reportTitle, margin, yPos);
        yPos += lineHeight * 2;

        // Add timestamp
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPos);
        yPos += lineHeight * 2;

        // Add content sections
        for (const section of options.content) {
            // Add section title
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');

            if (yPos > pdf.internal.pageSize.getHeight() - margin) {
                pdf.addPage();
                yPos = margin;
            }

            pdf.text(section.title, margin, yPos);
            yPos += lineHeight;

            // Add data
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');

            section.data.forEach(row => {
                if (yPos > pdf.internal.pageSize.getHeight() - margin) {
                    pdf.addPage();
                    yPos = margin;
                }
                pdf.text(row.join(': '), margin, yPos);
                yPos += lineHeight;
            });

            yPos += lineHeight;
        }

        pdf.save(options.fileName);
    } catch (error) {
        console.error('Error generating basic PDF report:', error);
        throw new Error('Failed to generate basic PDF report');
    }
};

export const downloadEnhancedPDF = async (
    element: HTMLElement,
    data: DownloadData,
    filename: string,
    title: string = ''
): Promise<void> => {
    try {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        }) as jsPDFWithAutoTable;

        // Add title
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        const pageWidth = pdf.internal.pageSize.getWidth();
        let yPosition = 20;

        if (title) {
            pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15;
        }

        // Add generation timestamp
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);
        yPosition += 15;

        // Add data sections
        Object.entries(data).forEach(([sectionTitle, sectionData]) => {
            // Section title
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text(sectionTitle, 20, yPosition);
            yPosition += 10;

            // Section data
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');

            // Convert section data to table format
            const tableData = Object.entries(sectionData).map(([key, value]) => [key, value.toString()]);

            // Add table
            autoTable(pdf, {
                startY: yPosition,
                head: [['Metric', 'Value']],
                body: tableData,
                margin: { left: 20 },
                theme: 'grid',
                headStyles: {
                    fillColor: [0, 136, 122],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                styles: {
                    fontSize: 10,
                    cellPadding: 5
                }
            });

            yPosition = pdf.lastAutoTable.finalY + 15;

            // Check if we need a new page
            if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
                pdf.addPage();
                yPosition = 20;
            }
        });

        // Save the PDF
        pdf.save(`${filename}.pdf`);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};
