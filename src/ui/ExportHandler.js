import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { calculateNetWorth, getTotalIncome, getTotalExpenses, getTotalTaxes, getNetWorthSeries } from '../state/DataUtils.js';
import { formatCurrency } from '../utils/Formatters.js';

export class ExportHandler {
    static async exportPDF() {
        console.log('Generating PDF...');
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('l', 'mm', 'a4');

            pdf.setFontSize(22);
            pdf.text('RetireFire Plan Report', 15, 20);
            pdf.setFontSize(12);
            pdf.text(`Projected for: ${config.settings.personal.name}`, 15, 32);
            pdf.text(`Current Worth: ${formatCurrency(calculateNetWorth(config.currentScenario, 0))}`, 15, 40);

            // Capture the main net worth chart via canvas
            const mainChart = document.getElementById('chartNetWorth');
            if (mainChart && window.html2canvas) {
                const canvas = await window.html2canvas(mainChart.parentElement);
                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', 15, 50, 260, 100);
            }

            pdf.save(`RetireFire_Plan_${config.settings.personal.name.replace(/\s/g, '_')}.pdf`);
        } catch (e) {
            console.error('PDF Export failed', e);
        }
    }

    static exportCSV() {
        const scenario = config.currentScenario;
        let csv = 'Year,Age,Net Worth,Income,Expenses,Taxes,Drawdown\n';

        rawData.years.forEach((year, i) => {
            const nw = calculateNetWorth(scenario, i);
            const inc = getTotalIncome(scenario, i);
            const exp = getTotalExpenses(scenario, i);
            const tax = getTotalTaxes(scenario, i);
            const draw = rawData[scenario].income.Drawdown?.[i] || 0;
            csv += `${year},${rawData.ages[i]},${nw},${inc},${exp},${tax},${draw}\n`;
        });

        this.downloadFile(csv, 'text/csv', 'retirement_projection.csv');
    }

    static exportJSON() {
        const data = {
            config,
            timestamp: new Date().toISOString(),
            projections: {
                average: getNetWorthSeries('average')
            }
        };
        this.downloadFile(JSON.stringify(data, null, 2), 'application/json', 'retirement_plan_backup.json');
    }

    static downloadFile(content, mimeType, filename) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}
