import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SummaryData {
    generatedAt: string;
    event: { name: string; date: string; description: string } | null;
    passengers: {
        total: number;
        registered: number;
        checkedIn: number;
        checkedOut: number;
        byNationality: { label: string; value: number }[];
        byAirline: { label: string; value: number }[];
        byDestination: { label: string; value: number }[];
        registrationTimeline: { date: string; count: number }[];
        list: {
            id: number; name: string; nationality: string; country: string; passport_number: string;
            departure_airline: string; departure_date: string; final_destination: string;
            flight_number: string; status: string; qr_generated_at: string;
        }[];
    };
    locations: { name: string; capacity: number; occupancy: number }[];
    support: {
        totalMessages: number;
        passengerMessages: number;
        staffReplies: number;
        uniqueConversations: number;
    };
    broadcasts: {
        total: number;
        history: { title: string; message: string; target_type: string; target_airline: string | null; target_destination: string | null; sent_at: string }[];
    };
}

// ─── Colors & Styles ───
const COLORS = {
    primary: [42, 45, 87] as [number, number, number],       // Deep navy
    accent: [99, 102, 241] as [number, number, number],      // Indigo
    accentLight: [238, 237, 255] as [number, number, number], // Light indigo
    text: [30, 41, 59] as [number, number, number],           // Slate 800
    textLight: [100, 116, 139] as [number, number, number],   // Slate 500
    white: [255, 255, 255] as [number, number, number],
    sectionBg: [248, 250, 252] as [number, number, number],   // Slate 50
    border: [226, 232, 240] as [number, number, number],      // Slate 200
    success: [16, 185, 129] as [number, number, number],      // Emerald
    warning: [245, 158, 11] as [number, number, number],      // Amber
    danger: [239, 68, 68] as [number, number, number],        // Red
};

function formatDate(iso: string): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return iso;
    }
}

function formatDateTime(iso: string): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch {
        return iso;
    }
}

function capitalizeStatus(s: string): string {
    if (!s) return '—';
    return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export async function generateSummaryPDF(): Promise<void> {
    // Fetch the summary data
    const res = await fetch('/api/admin/export-summary');
    if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `HTTP ${res.status}`);
    }
    const data: SummaryData = await res.json();

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 0;

    // ─── Helper: Add page footer ───
    const addFooter = () => {
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(...COLORS.textLight);
            doc.text(
                `Velana AeroCare — Confidential Summary Report | Page ${i} of ${pageCount}`,
                pageWidth / 2, pageHeight - 8, { align: 'center' }
            );
            doc.setDrawColor(...COLORS.border);
            doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        }
    };

    // ─── Helper: Check page break ───
    const checkBreak = (needed: number) => {
        if (y + needed > pageHeight - 20) {
            doc.addPage();
            y = 15;
        }
    };

    // ─── Helper: Section Header ───
    const sectionHeader = (title: string) => {
        checkBreak(18);
        y += 6;
        doc.setFillColor(...COLORS.accent);
        doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.white);
        doc.text(title.toUpperCase(), margin + 4, y + 7);
        y += 14;
        doc.setTextColor(...COLORS.text);
    };

    // ─── Helper: Key-Value Row ───
    const kvRow = (label: string, value: string | number, colWidth = contentWidth / 2) => {
        checkBreak(8);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.textLight);
        doc.text(label, margin + 2, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.text);
        doc.text(String(value), margin + colWidth, y);
        y += 6;
    };

    // ─── Helper: Stat Box ───
    const statBox = (x: number, w: number, label: string, value: string | number, color: [number, number, number]) => {
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(x, y, w, 18, 2, 2, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.white);
        doc.text(String(value), x + w / 2, y + 9, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(label, x + w / 2, y + 15, { align: 'center' });
    };

    // ════════════════════════════════════════════════
    // ═══ COVER HEADER ═══
    // ════════════════════════════════════════════════
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 52, 'F');

    // Logo mark
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(margin, 10, 12, 12, 2, 2, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text('A', margin + 6, 19, { align: 'center' });

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text('Velana AeroCare', margin + 16, 18);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 185, 230);
    doc.text('Comprehensive Passenger Care Summary Report', margin + 16, 26);

    // Event & date info
    doc.setFontSize(9);
    doc.setTextColor(160, 165, 210);
    if (data.event) {
        doc.text(`Event: ${data.event.name}`, margin, 37);
        doc.text(`Event Date: ${formatDate(data.event.date)}`, margin, 43);
    }
    doc.text(`Report Generated: ${formatDateTime(data.generatedAt)}`, pageWidth - margin, 37, { align: 'right' });
    doc.text('Classification: Official — For Authorized Distribution', pageWidth - margin, 43, { align: 'right' });

    // Divider accent line
    doc.setFillColor(...COLORS.accent);
    doc.rect(0, 52, pageWidth, 1.5, 'F');

    y = 60;

    // Intended recipients note
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.textLight);
    doc.text(
        'Prepared for: Tourism Ministry, Ministry of Foreign Affairs, Resort Partners, Travel Agencies, and Airport Authorities',
        pageWidth / 2, y, { align: 'center' }
    );
    y += 8;

    // ════════════════════════════════════════════════
    // ═══ 1. EXECUTIVE SUMMARY ═══
    // ════════════════════════════════════════════════
    sectionHeader('1. Executive Summary');

    // Status cards
    const boxW = (contentWidth - 9) / 4;
    statBox(margin, boxW, 'TOTAL PASSENGERS', data.passengers.total, COLORS.accent);
    statBox(margin + boxW + 3, boxW, 'REGISTERED', data.passengers.registered, [139, 92, 246]);
    statBox(margin + (boxW + 3) * 2, boxW, 'CHECKED IN', data.passengers.checkedIn, COLORS.success);
    statBox(margin + (boxW + 3) * 3, boxW, 'CHECKED OUT', data.passengers.checkedOut, COLORS.warning);
    y += 22;

    // Additional KPIs
    kvRow('Support Conversations', data.support.uniqueConversations);
    kvRow('Broadcasts Sent', data.broadcasts.total);

    // ════════════════════════════════════════════════
    // ═══ 2. PASSENGER DEMOGRAPHICS ═══
    // ════════════════════════════════════════════════
    sectionHeader('2. Passenger Demographics — By Nationality');

    if (data.passengers.byNationality.length > 0) {
        autoTable(doc, {
            startY: y,
            head: [['#', 'Nationality', 'Passengers', '% of Total']],
            body: data.passengers.byNationality.map((n, i) => [
                String(i + 1),
                n.label,
                String(n.value),
                `${Math.round((n.value / data.passengers.total) * 100)}%`,
            ]),
            margin: { left: margin, right: margin },
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8 },
            alternateRowStyles: { fillColor: COLORS.sectionBg },
            columnStyles: { 0: { cellWidth: 10 }, 2: { halign: 'center' }, 3: { halign: 'center' } },
        });
        y = (doc as any).lastAutoTable.finalY + 4;
    } else {
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.textLight);
        doc.text('No nationality data available.', margin + 2, y);
        y += 8;
    }

    // ─── By Airline ───
    sectionHeader('3. Passenger Demographics — By Airline');

    if (data.passengers.byAirline.length > 0) {
        autoTable(doc, {
            startY: y,
            head: [['#', 'Airline', 'Passengers', '% of Total']],
            body: data.passengers.byAirline.map((a, i) => [
                String(i + 1),
                a.label,
                String(a.value),
                `${Math.round((a.value / data.passengers.total) * 100)}%`,
            ]),
            margin: { left: margin, right: margin },
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8 },
            alternateRowStyles: { fillColor: COLORS.sectionBg },
            columnStyles: { 0: { cellWidth: 10 }, 2: { halign: 'center' }, 3: { halign: 'center' } },
        });
        y = (doc as any).lastAutoTable.finalY + 4;
    } else {
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.textLight);
        doc.text('No airline data available.', margin + 2, y);
        y += 8;
    }

    // ─── By Destination ───
    sectionHeader('4. Passenger Demographics — By Destination');

    if (data.passengers.byDestination.length > 0) {
        autoTable(doc, {
            startY: y,
            head: [['#', 'Destination', 'Passengers', '% of Total']],
            body: data.passengers.byDestination.map((d, i) => [
                String(i + 1),
                d.label,
                String(d.value),
                `${Math.round((d.value / data.passengers.total) * 100)}%`,
            ]),
            margin: { left: margin, right: margin },
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8 },
            alternateRowStyles: { fillColor: COLORS.sectionBg },
            columnStyles: { 0: { cellWidth: 10 }, 2: { halign: 'center' }, 3: { halign: 'center' } },
        });
        y = (doc as any).lastAutoTable.finalY + 4;
    } else {
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.textLight);
        doc.text('No destination data available.', margin + 2, y);
        y += 8;
    }


    y += 2;



    // ════════════════════════════════════════════════
    // ═══ 7. LOCATION OCCUPANCY ═══
    // ════════════════════════════════════════════════
    sectionHeader('7. Location Occupancy Status');

    if (data.locations.length > 0) {
        autoTable(doc, {
            startY: y,
            head: [['Location', 'Capacity', 'Current Occupancy', 'Utilization %']],
            body: data.locations.map((l) => [
                l.name,
                String(l.capacity),
                String(l.occupancy),
                l.capacity > 0 ? `${Math.round((l.occupancy / l.capacity) * 100)}%` : '0%',
            ]),
            margin: { left: margin, right: margin },
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8 },
            alternateRowStyles: { fillColor: COLORS.sectionBg },
            columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
        });
        y = (doc as any).lastAutoTable.finalY + 4;
    } else {
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.textLight);
        doc.text('No location data available.', margin + 2, y);
        y += 8;
    }

    // ════════════════════════════════════════════════
    // ═══ 8. SUPPORT SUMMARY ═══
    // ════════════════════════════════════════════════
    sectionHeader('8. Support & Communication Summary');

    kvRow('Total Messages Exchanged', data.support.totalMessages);
    kvRow('Passenger Messages', data.support.passengerMessages);
    kvRow('Staff Replies', data.support.staffReplies);
    kvRow('Unique Conversations', data.support.uniqueConversations);

    // ════════════════════════════════════════════════
    // ═══ 9. BROADCAST LOG ═══
    // ════════════════════════════════════════════════
    sectionHeader('9. Broadcast Communications Log');

    kvRow('Total Broadcasts Sent', data.broadcasts.total);
    y += 2;

    if (data.broadcasts.history.length > 0) {
        autoTable(doc, {
            startY: y,
            head: [['Date', 'Title', 'Target', 'Message']],
            body: data.broadcasts.history.map((b) => [
                formatDateTime(b.sent_at),
                b.title,
                b.target_type === 'all' ? 'All Passengers' :
                    b.target_type === 'airline' ? `Airline: ${b.target_airline || '—'}` :
                        `Dest: ${b.target_destination || '—'}`,
                b.message.length > 80 ? b.message.slice(0, 80) + '...' : b.message,
            ]),
            margin: { left: margin, right: margin },
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 7 },
            alternateRowStyles: { fillColor: COLORS.sectionBg },
            columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 30 }, 2: { cellWidth: 28 } },
        });
        y = (doc as any).lastAutoTable.finalY + 4;
    }

    // ════════════════════════════════════════════════
    // ═══ 10. REGISTRATION TIMELINE ═══
    // ════════════════════════════════════════════════
    if (data.passengers.registrationTimeline.length > 0) {
        sectionHeader('10. Daily Registration Timeline');

        autoTable(doc, {
            startY: y,
            head: [['Date', 'New Registrations', 'Cumulative']],
            body: (() => {
                let cumulative = 0;
                return data.passengers.registrationTimeline.map((t) => {
                    cumulative += t.count;
                    return [formatDate(t.date), String(t.count), String(cumulative)];
                });
            })(),
            margin: { left: margin, right: margin },
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8 },
            alternateRowStyles: { fillColor: COLORS.sectionBg },
            columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' } },
        });
        y = (doc as any).lastAutoTable.finalY + 4;
    }

    // ─── Add footers to all pages ───
    addFooter();

    // ─── Download ───
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    doc.save(`AeroCare-${dateStr}-${timeStr}.pdf`);
}
