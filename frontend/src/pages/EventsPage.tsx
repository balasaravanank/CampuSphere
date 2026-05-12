import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Users, Clock, Loader2, AlertCircle, CheckCircle2, Plus, X, Trash2, CalendarDays, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { Calendar } from '@/components/ui/calendar';
import './ModulePage.css';

interface EventItem {
  id: number;
  term: string;
  title: string;
  description: string | null;
  venue: string;
  capacity: number;
  waitlist_limit: number;
  confirmed_count: number;
  waitlist_count: number;
  start_time: string;
  end_time: string;
  booking_open: string;
  booking_close: string;
  status: 'open' | 'waitlist';
  my_booking_status: string | null;
}

function formatDateTimeDisplay(iso: string): string {
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  return d.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDate(d: Date | undefined): string {
  if (!d) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toDateInputValue(d: Date | undefined): string {
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateTimePretty(d: Date | undefined): string {
  if (!d) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Popover date picker using shadcn Calendar */
function InlineDatePicker({
  value,
  onChange,
  label,
}: {
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="input"
        onClick={() => setOpen(p => !p)}
        style={{
          padding: '10px 12px',
          borderRadius: '8px',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
          width: '100%',
        }}
      >
        <span>{value ? formatDate(value) : label}</span>
        <CalendarDays size={16} style={{ opacity: 0.5 }} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 100,
            marginTop: '4px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lg)',
            padding: '8px',
          }}
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => { onChange(d); setOpen(false); }}
          />
        </div>
      )}
    </div>
  );
}

/** Popover datetime picker: Calendar + hour/min selects */
function InlineDateTimePicker({
  value,
  onChange,
  label,
}: {
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];
  const curH = value ? String(value.getHours()).padStart(2, '0') : '09';
  const curM = value ? String(Math.floor(value.getMinutes() / 15) * 15).padStart(2, '0') : '00';

  const setTime = (h: string, m: string) => {
    const d = value ? new Date(value) : new Date();
    d.setHours(parseInt(h), parseInt(m), 0, 0);
    onChange(d);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="input"
        onClick={() => setOpen(p => !p)}
        style={{
          padding: '10px 12px',
          borderRadius: '8px',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
          width: '100%',
        }}
      >
        <span>{value ? formatDateTimePretty(value) : label}</span>
        <CalendarDays size={16} style={{ opacity: 0.5 }} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            zIndex: 100,
            marginBottom: '4px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lg)',
            padding: '8px',
          }}
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => {
              if (d) {
                const newD = new Date(d);
                if (value) newD.setHours(value.getHours(), value.getMinutes());
                else newD.setHours(9, 0, 0, 0);
                onChange(newD);
              }
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 4px',
              borderTop: '1px solid var(--border)',
              marginTop: '4px',
            }}
          >
            <Clock size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <select
              className="input"
              style={{ padding: '6px 8px', borderRadius: '6px', fontSize: '0.8125rem', flex: 1 }}
              value={curH}
              onChange={e => setTime(e.target.value, curM)}
            >
              {hours.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span style={{ fontWeight: 700 }}>:</span>
            <select
              className="input"
              style={{ padding: '6px 8px', borderRadius: '6px', fontSize: '0.8125rem', flex: 1 }}
              value={curM}
              onChange={e => setTime(curH, e.target.value)}
            >
              {minutes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'open' | 'upcoming' | 'closed'>('all');
  const [termFilter, setTermFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);

  // Calendar-based date states
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [bookingOpen, setBookingOpen] = useState<Date | undefined>();
  const [bookingClose, setBookingClose] = useState<Date | undefined>();

  const [formData, setFormData] = useState({
    term: 'General',
    title: '',
    description: '',
    venue: '',
    capacity: 50,
    waitlist_limit: 10,
    time_slot: '',
  });

  const TIME_SLOTS = [
    { label: '8.00 AM - 10.00 AM', value: '08:00-10:00' },
    { label: '10.00 AM - 12.00 NOON', value: '10:00-12:00' },
    { label: '1.00 PM - 3.00 PM', value: '13:00-15:00' },
    { label: '3.00 PM - 5.00 PM', value: '15:00-17:00' }
  ];
  const VENUE_OPTIONS = ['1852', '1851', '1731', '4371'];

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then(r => r.data.data),
  });

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events/').then(r => r.data.data as EventItem[]),
  });

  const createEventMutation = useMutation({
    mutationFn: () => {
      const dateStr = toDateInputValue(eventDate);
      const [startHour, endHour] = formData.time_slot.split('-');
      const payload = {
        term: formData.term || 'General',
        title: formData.title,
        description: formData.description,
        venue: formData.venue,
        capacity: Number(formData.capacity),
        waitlist_limit: Number(formData.waitlist_limit),
        start_time: new Date(`${dateStr}T${startHour}:00`).toISOString(),
        end_time: new Date(`${dateStr}T${endHour}:00`).toISOString(),
        booking_open: bookingOpen?.toISOString() ?? '',
        booking_close: bookingClose?.toISOString() ?? '',
      };
      return api.post('/events/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created successfully');
      setShowAddEvent(false);
      setFormData({ term: 'General', title: '', description: '', venue: '', capacity: 50, waitlist_limit: 10, time_slot: '' });
      setEventDate(undefined);
      setBookingOpen(undefined);
      setBookingClose(undefined);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to create event');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: number) => api.delete(`/events/${eventId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted successfully');
      setEventToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to delete event');
      setEventToDelete(null);
    },
  });

  const bookMutation = useMutation({
    mutationFn: (eventId: number) => api.post(`/events/${eventId}/book`),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      const event = data?.find(e => e.id === eventId);
      const isFull = (event?.confirmed_count ?? 0) >= (event?.capacity ?? 0);
      toast.success(isFull ? 'Added to waitlist!' : 'Slot booked successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to book slot');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (eventId: number) => api.delete(`/events/${eventId}/book`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Booking cancelled');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to cancel booking');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate || !bookingOpen || !bookingClose) {
      toast.error('Please select all dates');
      return;
    }
    createEventMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="module-page">
        <div className="module-header"><h2>Events &amp; Booking</h2></div>
        <div className="wf-state"><Loader2 size={24} className="spin" /><span>Loading events...</span></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="module-page">
        <div className="module-header"><h2>Events &amp; Booking</h2></div>
        <div className="wf-state wf-error"><AlertCircle size={20} /><span>Failed to load events</span></div>
      </div>
    );
  }

  const events = data ?? [];

  const now = new Date();
  
  // Get unique terms for filter
  const uniqueTerms = Array.from(new Set(events.map(e => e.term))).sort();

  const filteredEvents = events.filter(e => {
    const bookingOpens = e.booking_open ? new Date(e.booking_open.endsWith('Z') ? e.booking_open : e.booking_open + 'Z') : new Date(0);
    const bookingCloses = e.booking_close ? new Date(e.booking_close.endsWith('Z') ? e.booking_close : e.booking_close + 'Z') : new Date(8640000000000000);
    const eventStart = new Date(e.start_time.endsWith('Z') ? e.start_time : e.start_time + 'Z');
    
    if (filter === 'upcoming' && bookingOpens <= now) return false;
    if (filter === 'closed' && bookingCloses >= now) return false;
    if (filter === 'open' && (bookingOpens > now || bookingCloses < now)) return false;

    if (termFilter !== 'all' && e.term !== termFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!e.title.toLowerCase().includes(q) && !e.venue.toLowerCase().includes(q)) return false;
    }

    if (fromDate) {
      const startOfDay = new Date(fromDate);
      startOfDay.setHours(0, 0, 0, 0);
      if (eventStart < startOfDay) return false;
    }
    
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (eventStart > endOfDay) return false;
    }

    return true;
  });

  return (
    <div className="module-page">
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2>Events &amp; Booking</h2>
          <span className="badge badge-primary">{filteredEvents.length} events</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAdminOrStaff && (
            <button className="btn btn-sm event-create-trigger-btn" onClick={() => setShowAddEvent(true)}>
              <Plus size={16} /> Create Event
            </button>
          )}
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', background: 'var(--bg-elevated)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ flex: '1 1 250px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Search Events</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input type="text" className="input" placeholder="Title or venue..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', paddingLeft: '36px' }} />
          </div>
        </div>
        
        <div style={{ flex: '1 1 140px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Event Term</label>
          <select className="input" value={termFilter} onChange={e => setTermFilter(e.target.value)} style={{ width: '100%' }}>
            <option value="all">All Terms</option>
            {uniqueTerms.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 140px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Status</label>
          <select className="input" value={filter} onChange={e => setFilter(e.target.value as any)} style={{ width: '100%' }}>
            <option value="all">All Events</option>
            <option value="open">Currently Open</option>
            <option value="upcoming">Opening Soon</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div style={{ flex: '1 1 140px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>From Date</label>
          <InlineDatePicker value={fromDate} onChange={setFromDate} label="Any date" />
        </div>

        <div style={{ flex: '1 1 140px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>To Date</label>
          <InlineDatePicker value={toDate} onChange={setToDate} label="Any date" />
        </div>

        {(searchQuery || fromDate || toDate || filter !== 'all' || termFilter !== 'all') && (
          <div style={{ flex: '1 1 100%', display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', marginTop: '8px', borderTop: '1px dashed var(--border)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearchQuery(''); setFromDate(undefined); setToDate(undefined); setFilter('all'); setTermFilter('all'); }}>
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {filteredEvents.length === 0 && (
        <div className="wf-state" style={{ marginTop: '20px' }}><span>No events available matching your filter.</span></div>
      )}

      <div className="events-grid">
        {filteredEvents.map(e => {
          const isFull = e.confirmed_count >= e.capacity;
          const fillPct = Math.min((e.confirmed_count / e.capacity) * 100, 100);
          const isBooked = e.my_booking_status === 'confirmed';
          const isWaitlisted = e.my_booking_status === 'waitlisted';
          const isPending = bookMutation.isPending || cancelMutation.isPending;
          
          const waitlistFull = e.waitlist_limit > 0 && e.waitlist_count >= e.waitlist_limit;
          
          const bookingOpensDate = e.booking_open ? new Date(e.booking_open.endsWith('Z') ? e.booking_open : e.booking_open + 'Z') : new Date(0);
          const bookingClosesDate = e.booking_close ? new Date(e.booking_close.endsWith('Z') ? e.booking_close : e.booking_close + 'Z') : new Date(8640000000000000);
          const isOpeningSoon = bookingOpensDate > now;
          const isClosed = bookingClosesDate < now;
          const isOpenNow = !isOpeningSoon && !isClosed;

          const disableBooking = isFull && waitlistFull || isOpeningSoon || isClosed;

          return (
            <div key={e.id} className="card event-card">
              <div className="event-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h4 className="event-title" style={{ margin: 0, flex: 1, paddingRight: '12px', fontSize: '1.1rem' }}>{e.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <div>
                    {isBooked && <span className="badge badge-success"><CheckCircle2 size={12} /> Booked</span>}
                    {isWaitlisted && <span className="badge badge-warning"><Clock size={12} /> Waitlisted</span>}
                    {!isBooked && !isWaitlisted && (
                      <span className={`badge ${
                        isClosed ? 'badge-secondary' : 
                        isOpeningSoon ? 'badge-primary' : 
                        isFull ? (waitlistFull ? 'badge-danger' : 'badge-warning') : 
                        'badge-success'
                      }`}>
                        {isClosed ? 'Closed' : 
                         isOpeningSoon ? 'Opening Soon' : 
                         isFull ? (waitlistFull ? 'Full' : 'Waitlist') : 
                         'Open'}
                      </span>
                    )}
                  </div>
                  {isAdminOrStaff && (
                    <button 
                      className="btn-icon text-danger" 
                      title="Delete Event"
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', margin: '-4px' }}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        if (confirm('Are you sure you want to delete this event? This action will also cancel all bookings for this event.')) {
                          setEventToDelete(e.id);
                          deleteMutation.mutate(e.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending && eventToDelete === e.id ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                    </button>
                  )}
                </div>
              </div>
              
              {e.description && (
                <p className="text-secondary" style={{ fontSize: '0.95rem', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {e.description}
                </p>
              )}

              <div className="event-details" style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  <MapPin size={16} /> Venue: {e.venue}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  <CalendarDays size={16} /> Date: {formatDate(new Date(e.start_time.endsWith('Z') ? e.start_time : e.start_time + 'Z'))}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  <Clock size={16} /> Time: {new Date(e.start_time.endsWith('Z') ? e.start_time : e.start_time + 'Z').toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - {new Date(e.end_time.endsWith('Z') ? e.end_time : e.end_time + 'Z').toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CalendarDays size={14} /> <strong>Opens:</strong> {formatDateTimeDisplay(e.booking_open)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CalendarDays size={14} /> <strong>Closes:</strong> {formatDateTimeDisplay(e.booking_close)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> {e.confirmed_count}/{e.capacity} confirmed
                  {e.waitlist_limit > 0 && <span className="text-secondary"> · {e.waitlist_count}/{e.waitlist_limit} waiting</span>}
                </span>
              </div>

              <div className="event-capacity-bar" style={{ marginTop: '12px' }}>
                <div
                  className={`event-capacity-fill ${isFull ? 'full' : ''}`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>

              {isBooked || isWaitlisted ? (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', marginTop: 16 }}
                  onClick={() => cancelMutation.mutate(e.id)}
                  disabled={isPending || isClosed}
                >
                  {cancelMutation.isPending ? <Loader2 size={12} className="spin" /> : 'Cancel Booking'}
                </button>
              ) : (
                <button
                  className={`btn btn-sm ${disableBooking ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ width: '100%', marginTop: 16, opacity: disableBooking ? 0.6 : 1 }}
                  onClick={() => bookMutation.mutate(e.id)}
                  disabled={isPending || disableBooking}
                >
                  {bookMutation.isPending
                    ? <Loader2 size={12} className="spin" />
                    : isClosed ? 'Closed' 
                    : isOpeningSoon ? 'Opening Soon'
                    : isFull ? (waitlistFull ? 'Fully Booked' : 'Join Waitlist') : 'Book Slot'
                  }
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showAddEvent && (
        <div className="modal-backdrop">
          <div className="modal-content event-create-modal" style={{ maxWidth: '850px', width: '95%' }}>
            <div className="modal-header event-create-modal-header">
              <h3 className="event-create-modal-title">Create New Event</h3>
              <button className="btn-icon" onClick={() => setShowAddEvent(false)}><X size={20} /></button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="event-create-form"
              style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1px minmax(0, 1fr)', gap: '16px 24px', padding: '16px' }}
            >
              
              {/* Left Column (Event Details) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 className="event-create-section-title" style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Event Details</h4>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Event Term / Category</label>
                  <input required type="text" list="event-terms-list" className="input" style={{ padding: '8px 10px', borderRadius: '6px', fontSize: '0.9rem' }} value={formData.term} onChange={e => setFormData({ ...formData, term: e.target.value })} placeholder="e.g. 25-26-HOSTEL BOOKING" />
                  <datalist id="event-terms-list">
                    <option value="General" />
                    <option value="25-26-HOSTEL BOOKING" />
                    {uniqueTerms.filter(t => t !== 'General' && t !== '25-26-HOSTEL BOOKING').map(t => <option key={t} value={t} />)}
                  </datalist>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Event Title</label>
                  <input required type="text" className="input" style={{ padding: '8px 10px', borderRadius: '6px', fontSize: '0.9rem' }} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="IEEE Tech Talk" />
                </div>
                <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Description</label>
                  <textarea className="input" style={{ flex: 1, minHeight: '60px', padding: '8px 10px', borderRadius: '6px', resize: 'vertical', fontSize: '0.9rem' }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Details about the event..." />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Venue</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '6px' }}>
                    {VENUE_OPTIONS.map(venue => (
                      <button
                        type="button"
                        key={venue}
                        onClick={() => setFormData({ ...formData, venue })}
                        style={{
                          padding: '6px 4px',
                          borderRadius: '6px',
                          border: `1px solid ${formData.venue === venue ? 'var(--accent)' : 'var(--border)'}`,
                          background: formData.venue === venue ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                          color: formData.venue === venue ? 'var(--accent)' : 'inherit',
                          fontWeight: formData.venue === venue ? 600 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontSize: '0.75rem',
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {venue}
                      </button>
                    ))}
                  </div>
                  <input
                    required
                    type="text"
                    className="input"
                    style={{ padding: '8px 10px', borderRadius: '6px', fontSize: '0.9rem' }}
                    value={formData.venue}
                    onChange={e => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="Type venue or pick above"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Capacity Limit</label>
                    <input required type="number" min="1" className="input" style={{ padding: '8px 10px', borderRadius: '6px', fontSize: '0.9rem' }} value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Waitlist Limit</label>
                    <input required type="number" min="0" className="input" style={{ padding: '8px 10px', borderRadius: '6px', fontSize: '0.9rem' }} value={formData.waitlist_limit} onChange={e => setFormData({ ...formData, waitlist_limit: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ background: 'var(--border)' }}></div>

              {/* Right Column (Scheduling) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 className="event-create-section-title" style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Scheduling &amp; Booking</h4>
                
                {/* Event Date — Calendar Picker */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Event Date</label>
                  <InlineDatePicker value={eventDate} onChange={setEventDate} label="Select date…" />
                </div>

                {/* Time Slot Buttons */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Time Slot</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {TIME_SLOTS.map(slot => (
                      <button
                        type="button"
                        key={slot.value}
                        onClick={() => setFormData({ ...formData, time_slot: slot.value })}
                        style={{ 
                          padding: '6px 8px', 
                          borderRadius: '6px', 
                          border: `1px solid ${formData.time_slot === slot.value ? 'var(--accent)' : 'var(--border)'}`, 
                          background: formData.time_slot === slot.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                          color: formData.time_slot === slot.value ? 'var(--accent)' : 'inherit',
                          fontWeight: formData.time_slot === slot.value ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontSize: '0.75rem',
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Booking Opens — Calendar + Time */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Booking Opens</label>
                  <InlineDateTimePicker value={bookingOpen} onChange={setBookingOpen} label="Select date & time…" />
                </div>

                {/* Booking Closes — Calendar + Time */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Booking Closes</label>
                  <InlineDateTimePicker value={bookingClose} onChange={setBookingClose} label="Select date & time…" />
                </div>
              </div>

              {/* Actions */}
              <div className="modal-actions event-create-modal-actions" style={{ gridColumn: '1 / -1', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary event-modal-cancel" onClick={() => setShowAddEvent(false)}>Cancel</button>
                <button type="submit" className="btn event-modal-submit" disabled={createEventMutation.isPending || !formData.time_slot || !eventDate}>
                  {createEventMutation.isPending ? <Loader2 size={18} className="spin" /> : <><Plus size={16} /> Create Event</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



