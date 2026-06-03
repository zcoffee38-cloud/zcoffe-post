import { formatCurrency, formatDate, formatDateTime } from '../lib/utils';

// Helper to group transactions by date (oldest to newest for the chart)
const groupTransactionsByDay = (transactions = []) => {
  const groups = {};
  const sorted = [...transactions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  sorted.forEach((t) => {
    const day = new Date(t.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
    if (!groups[day]) {
      groups[day] = { day, omset: 0, laba: 0 };
    }
    groups[day].omset += t.total;
    groups[day].laba += t.totalProfit;
  });

  return Object.values(groups);
};

function SalesChart({ data }) {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => Math.max(d.omset, d.laba)), 1000);

  const width = 700;
  const height = 180;
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const barCount = data.length;
  const barGap = 6;
  const totalGapsWidth = barGap * (barCount - 1);
  const clusterWidth = (chartWidth - totalGapsWidth) / barCount;
  const singleBarWidth = clusterWidth / 2;

  return (
    <div className="my-6">
      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 font-sans">Grafik Tren Omset & Laba</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-300 font-mono text-[9px]">
        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = paddingTop + chartHeight * (1 - ratio);
          const val = Math.round(maxVal * ratio);
          return (
            <g key={i} className="opacity-60">
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#d1d5db" strokeDasharray="3" strokeWidth="0.75" />
              <text x={paddingLeft - 8} y={y + 3} textAnchor="end" fill="#4b5563">
                {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = paddingLeft + i * (clusterWidth + barGap);
          const omsetHeight = (d.omset / maxVal) * chartHeight;
          const labaHeight = (d.laba / maxVal) * chartHeight;

          const omsetY = paddingTop + chartHeight - omsetHeight;
          const labaY = paddingTop + chartHeight - labaHeight;

          return (
            <g key={i}>
              {/* Omset Bar (Dark) */}
              <rect
                x={x}
                y={omsetY}
                width={singleBarWidth}
                height={omsetHeight}
                fill="#4b3621"
                rx="0.5"
              />
              {/* Laba Bar (Light) */}
              <rect
                x={x + singleBarWidth}
                y={labaY}
                width={singleBarWidth}
                height={labaHeight}
                fill="#c89d7c"
                rx="0.5"
              />
              {/* X-axis labels */}
              {(barCount <= 15 || i % Math.ceil(barCount / 10) === 0) && (
                <text x={x + clusterWidth / 2} y={height - 12} textAnchor="middle" fill="#4b5563" fontWeight="bold">
                  {d.day}
                </text>
              )}
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${width - 120}, 4)`} fontSize="9" fontWeight="bold">
          <rect x="0" y="0" width="8" height="8" fill="#4b3621" rx="0.5" />
          <text x="12" y="7.5" fill="#374151">Omset</text>
          
          <rect x="55" y="0" width="8" height="8" fill="#c89d7c" rx="0.5" />
          <text x="67" y="7.5" fill="#374151">Laba</text>
        </g>
      </svg>
    </div>
  );
}

export default function ReportPrintArea({ salesData, startDate, endDate, settings }) {
  if (!salesData) return null;

  const { summary, transactions = [] } = salesData;
  const dailyData = groupTransactionsByDay(transactions);
  
  const paymentLabels = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer' };

  return (
    <div className="report-print-area hidden p-6 font-mono text-xs text-black bg-white" style={{ fontFamily: 'Courier New, Courier, monospace' }}>
      {/* Kop Laporan */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-5">
        <h1 className="text-lg font-bold uppercase tracking-wide">{settings?.shop_name || 'Z COFFEE'}</h1>
        <p className="text-[10px] text-gray-700 mt-0.5">Telp: {settings?.shop_phone || '-'}</p>
        <p className="text-[10px] text-gray-600 leading-snug">{settings?.shop_address || '-'}</p>
        <h2 className="text-sm font-bold uppercase tracking-wider mt-3 border-t border-dashed border-gray-400 pt-2">
          LAPORAN TRANSAKSI PENJUALAN
        </h2>
        <p className="text-[10px] text-gray-700 mt-1">
          Periode: {formatDate(startDate)} s/d {formatDate(endDate)}
        </p>
      </div>

      {/* Ringkasan Ringkas */}
      <div className="grid grid-cols-3 gap-4 border border-gray-400 p-4 rounded-lg bg-gray-50 mb-6">
        <div>
          <span className="block text-[10px] text-gray-600 uppercase font-sans font-semibold">Total Omset</span>
          <strong className="text-sm">{formatCurrency(summary?.totalRevenue || 0)}</strong>
        </div>
        <div>
          <span className="block text-[10px] text-gray-600 uppercase font-sans font-semibold">Total Laba Bersih</span>
          <strong className="text-sm">{formatCurrency(summary?.totalProfit || 0)}</strong>
        </div>
        <div>
          <span className="block text-[10px] text-gray-600 uppercase font-sans font-semibold">Jumlah Transaksi</span>
          <strong className="text-sm">{summary?.totalTransactions || 0} Transaksi</strong>
        </div>
      </div>

      {/* Grafik Tren */}
      <SalesChart data={dailyData} />

      {/* Tabel Transaksi */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider font-sans">Rincian Transaksi Penjualan</h3>
        <table className="w-full text-[10px] text-left border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-400">
              <th className="border border-gray-400 p-2 font-bold w-[4%] text-center">No</th>
              <th className="border border-gray-400 p-2 font-bold w-[18%]">No. Invoice</th>
              <th className="border border-gray-400 p-2 font-bold w-[18%]">Tanggal & Waktu</th>
              <th className="border border-gray-400 p-2 font-bold w-[15%]">Pelanggan</th>
              <th className="border border-gray-400 p-2 font-bold w-[12%]">Pembayaran</th>
              <th className="border border-gray-400 p-2 font-bold w-[16%] text-right">Omset (Rp)</th>
              <th className="border border-gray-400 p-2 font-bold w-[17%] text-right">Laba (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, idx) => (
              <tr key={t.id} className="border-b border-gray-300">
                <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                <td className="border border-gray-300 p-2 font-bold font-mono">{t.invoiceNumber}</td>
                <td className="border border-gray-300 p-2">{formatDateTime(t.createdAt)}</td>
                <td className="border border-gray-300 p-2 truncate">{t.customerName || '-'}</td>
                <td className="border border-gray-300 p-2">{paymentLabels[t.paymentMethod] || t.paymentMethod}</td>
                <td className="border border-gray-300 p-2 text-right font-bold">{formatCurrency(t.total).replace('Rp', '').trim()}</td>
                <td className="border border-gray-300 p-2 text-right font-bold text-gray-800">{formatCurrency(t.totalProfit).replace('Rp', '').trim()}</td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className="bg-gray-50 font-bold border-t-2 border-gray-400">
              <td colSpan={5} className="border border-gray-400 p-2 text-right uppercase">TOTAL</td>
              <td className="border border-gray-400 p-2 text-right">{formatCurrency(summary?.totalRevenue || 0).replace('Rp', '').trim()}</td>
              <td className="border border-gray-400 p-2 text-right">{formatCurrency(summary?.totalProfit || 0).replace('Rp', '').trim()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Metadata Cetak */}
      <div className="text-right text-[8px] text-gray-500 mt-8 border-t border-dashed border-gray-300 pt-2">
        Laporan dicetak secara sistem pada: {new Date().toLocaleString('id-ID')}
      </div>
    </div>
  );
}
