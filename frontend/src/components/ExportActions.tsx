import { useState } from 'react';
import { Calendar, Copy, Check, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Itinerary, TripMeta, WeatherData, BudgetBreakdownINR } from '../types/travel';

interface Props {
  itinerary: Itinerary;
  meta?: TripMeta;
  weather?: WeatherData;
  budget?: BudgetBreakdownINR;
}

export function ExportActions({ itinerary }: Props) {
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const triggerConfetti = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#a78bfa', '#38bdf8', '#34d399', '#f472b6'],
    });
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(itinerary, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate .ics calendar file
  const handleDownloadIcs = () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SAFAR-AI//Travel Planner//EN',
      'CALSCALE:GREGORIAN',
    ];

    const today = new Date();

    itinerary.days.forEach((day, dIdx) => {
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() + dIdx + 1);
      const dateStr = dayDate.toISOString().slice(0, 10).replace(/-/g, '');

      // Morning
      if (day.morning) {
        ics.push(
          'BEGIN:VEVENT',
          `SUMMARY:Day ${day.day} Morning: ${day.morning.activity}`,
          `DESCRIPTION:${day.morning.description} - Tip: ${day.morning.tips || 'None'}`,
          `LOCATION:${day.morning.place || itinerary.destination}`,
          `DTSTART:${dateStr}T090000Z`,
          `DTEND:${dateStr}T120000Z`,
          'END:VEVENT'
        );
      }

      // Afternoon
      if (day.afternoon) {
        ics.push(
          'BEGIN:VEVENT',
          `SUMMARY:Day ${day.day} Afternoon: ${day.afternoon.activity}`,
          `DESCRIPTION:${day.afternoon.description}`,
          `LOCATION:${day.afternoon.place || itinerary.destination}`,
          `DTSTART:${dateStr}T130000Z`,
          `DTEND:${dateStr}T170000Z`,
          'END:VEVENT'
        );
      }

      // Evening
      if (day.evening) {
        ics.push(
          'BEGIN:VEVENT',
          `SUMMARY:Day ${day.day} Evening: ${day.evening.activity}`,
          `DESCRIPTION:${day.evening.description}`,
          `LOCATION:${day.evening.place || itinerary.destination}`,
          `DTSTART:${dateStr}T180000Z`,
          `DTEND:${dateStr}T210000Z`,
          'END:VEVENT'
        );
      }
    });

    ics.push('END:VCALENDAR');
    const blob = new Blob([ics.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${itinerary.destination.replace(/[^a-zA-Z0-9]/g, '_')}_itinerary.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerConfetti();
  };

  // PDF Export
  const handleExportPdf = async () => {
    const el = document.getElementById('itinerary-content-root');
    if (!el) return;
    setExportingPdf(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${itinerary.destination.replace(/[^a-zA-Z0-9]/g, '_')}_trip_plan_INR.pdf`);
      triggerConfetti();
    } catch (e) {
      console.error('PDF export failed:', e);
      window.print();
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Calendar .ics download */}
      <button
        onClick={handleDownloadIcs}
        className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white/70 hover:bg-white border border-white/60 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-all shadow-sm"
        title="Add entire trip to Apple / Google Calendar"
      >
        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
        <span>Add to Calendar (.ics)</span>
      </button>

      {/* PDF Export (INR Formatted) */}
      <button
        onClick={handleExportPdf}
        disabled={exportingPdf}
        className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white/70 hover:bg-white border border-white/60 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-all shadow-sm"
        title="Download printable PDF travel guide in INR (₹)"
      >
        <FileText className="w-3.5 h-3.5 text-rose-500" />
        <span>{exportingPdf ? 'Generating PDF...' : 'Download PDF (₹)'}</span>
      </button>

      {/* JSON Copy */}
      <button
        onClick={handleCopyJson}
        className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white/70 hover:bg-white border border-white/60 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-all shadow-sm"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
        <span>{copied ? 'Copied' : 'JSON'}</span>
      </button>
    </div>
  );
}
