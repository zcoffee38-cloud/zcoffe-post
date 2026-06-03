import { useEffect, useState } from 'react';
import { Clock, CheckCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { cn, formatDateTime } from '../lib/utils';
import { useToast } from '../components/ui/toaster';
import { getSocket } from '../services/socket';
import api from '../api';

const statusConfig = {
  waiting:    { label: 'Menunggu',   color: 'warning',     bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' },
  processing: { label: 'Diproses',   color: 'default',     bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' },
  done:       { label: 'Selesai',    color: 'success',     bg: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' },
};

function QueueCard({ queue, onUpdateStatus }) {
  const cfg = statusConfig[queue.status];
  return (
    <div className={cn('rounded-2xl border p-4 transition-all duration-300 animate-fade-in', cfg.bg)}>
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-coffee-950 flex flex-col items-center justify-center shrink-0">
          <span className="text-coffee-400 text-[10px] uppercase tracking-wider">No.</span>
          <span className="text-cream-50 font-bold font-mono text-2xl leading-none">{queue.queueNumber}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={cfg.color}>{cfg.label}</Badge>
            <span className="text-xs text-muted-foreground">{formatDateTime(queue.createdAt)}</span>
          </div>
          {queue.transaction?.customerName && (
            <p className="text-sm font-semibold mb-1">{queue.transaction.customerName}</p>
          )}
          <div className="space-y-0.5">
            {queue.transaction?.items?.map((item, idx) => (
              <p key={idx} className="text-sm">
                <span className="font-semibold">{item.qty}x</span>{' '}
                <span className="text-muted-foreground">{item.product?.name}</span>
              </p>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          {queue.status === 'waiting' && (
            <Button size="sm" onClick={() => onUpdateStatus(queue.id, 'processing')}>
              <Loader2 className="h-3.5 w-3.5" />
              Proses
            </Button>
          )}
          {queue.status === 'processing' && (
            <Button size="sm" variant="secondary" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => onUpdateStatus(queue.id, 'done')}>
              <CheckCircle className="h-3.5 w-3.5" />
              Selesai
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AntrianPage() {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchQueues = async () => {
    try {
      const { data } = await api.get('/queues');
      setQueues(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchQueues();
    const socket = getSocket();
    socket.emit('join:cashier');
    socket.on('queue:new', (q) => {
      setQueues(prev => [q, ...prev]);
      toast({ title: `Antrian #${q.queueNumber} masuk!`, variant: 'default' });
    });
    socket.on('queue:updated', (updated) => {
      setQueues(prev => prev.map(q => q.id === updated.id ? updated : q));
    });
    return () => { socket.off('queue:new'); socket.off('queue:updated'); };
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/queues/${id}/status`, { status });
    } catch (e) {
      toast({ title: 'Gagal update status', variant: 'destructive' });
    }
  };

  const waiting = queues.filter(q => q.status === 'waiting');
  const processing = queues.filter(q => q.status === 'processing');
  const done = queues.filter(q => q.status === 'done');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Antrian</h1>
          <p className="text-muted-foreground text-sm">Kelola antrian pesanan hari ini</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchQueues}><RefreshCw className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => window.open('/monitor-antrian', '_blank')}>
            <ExternalLink className="h-4 w-4" /> Monitor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { label: 'Menunggu', count: waiting.length, color: 'text-amber-600' },
          { label: 'Diproses', count: processing.length, color: 'text-blue-600' },
          { label: 'Selesai', count: done.length, color: 'text-green-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={cn('text-3xl font-bold', s.color)}>{s.count}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { title: 'Menunggu', queues: waiting, icon: Clock },
          { title: 'Diproses', queues: processing, icon: Loader2 },
          { title: 'Selesai', queues: done, icon: CheckCircle },
        ].map(col => (
          <div key={col.title} className="space-y-3">
            <Card>
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <col.icon className="h-4 w-4" /> {col.title}
                  <Badge variant="secondary" className="ml-auto">{col.queues.length}</Badge>
                </CardTitle>
              </CardHeader>
            </Card>
            {loading
              ? Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
              : col.queues.length === 0
                ? <p className="text-sm text-muted-foreground text-center py-4">Tidak ada antrian</p>
                : col.queues.map(q => <QueueCard key={q.id} queue={q} onUpdateStatus={updateStatus} />)
            }
          </div>
        ))}
      </div>
    </div>
  );
}
