import { useEffect, useState } from 'react';
import { Coffee } from 'lucide-react';
import { cn } from '../lib/utils';
import { getSocket } from '../services/socket';
import api from '../api';

export default function AntrianMonitorPage() {
  const [queues, setQueues] = useState([]);

  useEffect(() => {
    // Fetch today's queues
    api.get('/queues').then(r => setQueues(r.data.data)).catch(console.error);

    const socket = getSocket();
    socket.emit('join:queue-monitor');

    socket.on('queue:new', (q) => {
      setQueues(prev => [q, ...prev]);
    });
    socket.on('queue:updated', (updated) => {
      setQueues(prev => prev.map(q => q.id === updated.id ? updated : q));
    });

    return () => {
      socket.off('queue:new');
      socket.off('queue:updated');
    };
  }, []);

  const waiting = queues.filter(q => q.status === 'waiting').slice(0, 8);
  const processing = queues.filter(q => q.status === 'processing').slice(0, 4);

  return (
    <div className="min-h-screen bg-coffee-950 text-cream-50 p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-coffee-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coffee-700 flex items-center justify-center">
            <Coffee className="h-5 w-5 text-cream-50" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-cream-100">Z Coffee</h1>
            <p className="text-coffee-400 text-sm">Monitor Antrian</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-coffee-400 text-sm">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <Clock />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sedang Diproses */}
        <div className="lg:col-span-1">
          <h2 className="text-coffee-400 text-sm font-semibold uppercase tracking-widest mb-4">Sedang Diproses</h2>
          <div className="space-y-3">
            {processing.length === 0 ? (
              <div className="rounded-2xl border border-coffee-800 bg-coffee-900/40 p-8 text-center">
                <p className="text-coffee-500 text-sm">Tidak ada pesanan diproses</p>
              </div>
            ) : processing.map((q) => (
              <div key={q.id} className="rounded-2xl border border-blue-500/40 bg-blue-500/10 p-5 flex items-center gap-4 animate-fade-in">
                <div className="w-16 h-16 rounded-xl bg-blue-500/20 border border-blue-500/40 flex flex-col items-center justify-center shrink-0">
                  <span className="text-blue-400 text-[9px] uppercase tracking-wider">No</span>
                  <span className="text-blue-300 font-bold font-mono text-3xl leading-none">{q.queueNumber}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">● Diproses</span>
                  </div>
                  {q.transaction?.customerName && (
                    <p className="text-cream-100 text-sm font-semibold mb-1">{q.transaction.customerName}</p>
                  )}
                  {q.transaction?.items?.map((item, i) => (
                    <p key={i} className="text-coffee-200 text-sm">{item.qty}x {item.product?.name}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Menunggu */}
        <div className="lg:col-span-2">
          <h2 className="text-coffee-400 text-sm font-semibold uppercase tracking-widest mb-4">Menunggu</h2>
          {waiting.length === 0 ? (
            <div className="rounded-2xl border border-coffee-800 bg-coffee-900/40 p-16 text-center">
              <p className="text-coffee-500 text-sm">Semua antrian sudah diproses 🎉</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {waiting.map((q, idx) => (
                <div
                  key={q.id}
                  className={cn(
                    'rounded-2xl border p-5 flex flex-col items-center justify-center text-center gap-1 aspect-square animate-fade-in',
                    idx === 0
                      ? 'border-amber-400/60 bg-amber-500/15 scale-105'
                      : 'border-coffee-700 bg-coffee-900/40'
                  )}
                >
                  <span className={cn('text-xs uppercase tracking-widest font-semibold', idx === 0 ? 'text-amber-400' : 'text-coffee-500')}>
                    {idx === 0 ? '● Berikutnya' : `Antrian ${idx + 1}`}
                  </span>
                  <span className={cn('font-bold font-mono leading-none', idx === 0 ? 'text-5xl text-amber-300' : 'text-4xl text-coffee-300')}>
                    {q.queueNumber}
                  </span>
                  {q.transaction?.customerName && (
                    <span className="text-xs text-coffee-300 max-w-full truncate">{q.transaction.customerName}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer ticker */}
      <div className="border-t border-coffee-800 pt-4 flex items-center justify-between text-coffee-500 text-xs">
        <span>Z Coffee POS System</span>
        <span>{queues.filter(q => q.status === 'done').length} pesanan selesai hari ini</span>
      </div>
    </div>
  );
}

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <p className="text-cream-100 font-mono text-xl font-bold">
      {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </p>
  );
}
