import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Send, MapPin, Users, Clock, AlignLeft,
  CalendarDays, DoorOpen, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { Calendar } from '@/components/ui/calendar';
import './ModulePage.css';

const TIME_SLOTS = [
  { label: '8.00 AM – 10.00 AM', value: '08:00-10:00' },
  { label: '10.00 AM – 12.00 NOON', value: '10:00-12:00' },
  { label: '1.00 PM – 3.00 PM', value: '13:00-15:00' },
  { label: '3.00 PM – 5.00 PM', value: '15:00-17:00' },
];

const VENUE_OPTIONS = ['1852', '1851', '1731', '4371'];

function formatDate(d: Date | undefined): string {
  if (!d) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toDateInputValue(d: Date | undefined): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateTime(d: Date | undefined): string {
  if (!d) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function toDateTimeInputValue(d: Date | undefined): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

/** A popover-style calendar date picker that replaces native <input type="date"> */
function DatePickerField({
  label,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  icon: typeof CalendarDays;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="form-group" ref={ref} style={{ position: 'relative' }}>
      <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Icon size={14} /> {label}
      </label>
      <button
        type="button"
        className="input"
        onClick={() => setOpen(prev => !prev)}
        style={{
          padding: '10px 12px',
          borderRadius: '8px',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
        }}
      >
        <span>{value ? formatDate(value) : 'Select date…'}</span>
        <CalendarDays size={16} style={{ opacity: 0.5 }} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 50,
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

/** A popover that combines Calendar + time selects for datetime-local replacement */
function DateTimePickerField({
  label,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  icon: typeof CalendarDays;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];
  const currentHour = value ? String(value.getHours()).padStart(2, '0') : '09';
  const currentMin = value ? String(Math.floor(value.getMinutes() / 15) * 15).padStart(2, '0') : '00';

  const setTime = (h: string, m: string) => {
    const d = value ? new Date(value) : new Date();
    d.setHours(parseInt(h), parseInt(m), 0, 0);
    onChange(d);
  };

  return (
    <div className="form-group" ref={ref} style={{ position: 'relative' }}>
      <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Icon size={14} /> {label}
      </label>
      <button
        type="button"
        className="input"
        onClick={() => setOpen(prev => !prev)}
        style={{
          padding: '10px 12px',
          borderRadius: '8px',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
        }}
      >
        <span>{value ? formatDateTime(value) : 'Select date & time…'}</span>
        <CalendarDays size={16} style={{ opacity: 0.5 }} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 50,
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
            onSelect={(d) => {
              if (d) {
                const newD = new Date(d);
                if (value) { newD.setHours(value.getHours(), value.getMinutes()); }
                else { newD.setHours(9, 0, 0, 0); }
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
              value={currentHour}
              onChange={e => setTime(e.target.value, currentMin)}
            >
              {hours.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span style={{ fontWeight: 700 }}>:</span>
            <select
              className="input"
              style={{ padding: '6px 8px', borderRadius: '6px', fontSize: '0.8125rem', flex: 1 }}
              value={currentMin}
              onChange={e => setTime(currentHour, e.target.value)}
            >
              {minutes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminEventCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [bookingOpen, setBookingOpen] = useState<Date | undefined>();
  const [bookingClose, setBookingClose] = useState<Date | undefined>();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    capacity: 50,
    waitlist_limit: 10,
    time_slot: '',
  });

  const createEventMutation = useMutation({
    mutationFn: () => {
      const dateStr = toDateInputValue(eventDate);
      const [startHour, endHour] = formData.time_slot.split('-');
      const payload = {
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
      navigate('/events');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to create event');
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

  const set = (key: string, value: string | number) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  return (
    <div className="module-page">
      {/* Header */}
      <div className="module-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/admin')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h2>Create New Event</h2>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 1px minmax(0, 1fr)',
          gap: '32px',
        }}
        className="card"
      >
        {/* ── Left Column: Event Details ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h4
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              margin: 0,
              paddingBottom: '4px',
            }}
          >
            Event Details
          </h4>

          <div className="form-group">
            <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlignLeft size={14} /> Event Title
            </label>
            <input
              required
              type="text"
              className="input"
              style={{ padding: '10px 12px', borderRadius: '8px' }}
              value={formData.title}
              onChange={e => set('title', e.target.value)}
              placeholder="IEEE Tech Talk"
            />
          </div>

          <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlignLeft size={14} /> Description
            </label>
            <textarea
              className="input"
              style={{ flex: 1, minHeight: '120px', padding: '12px', borderRadius: '8px', resize: 'vertical' }}
              value={formData.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Details about the event..."
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} /> Venue
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              {VENUE_OPTIONS.map(venue => (
                <button
                  type="button"
                  key={venue}
                  onClick={() => set('venue', venue)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '7px',
                    border: `1px solid ${formData.venue === venue ? 'var(--accent)' : 'var(--border)'}`,
                    background: formData.venue === venue ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    color: formData.venue === venue ? 'var(--accent)' : 'inherit',
                    fontWeight: formData.venue === venue ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.78rem',
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
              style={{ padding: '10px 12px', borderRadius: '8px' }}
              value={formData.venue}
              onChange={e => set('venue', e.target.value)}
              placeholder="Type venue or pick above"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} /> Capacity
              </label>
              <input
                required
                type="number"
                min="1"
                className="input"
                style={{ padding: '10px 12px', borderRadius: '8px' }}
                value={formData.capacity}
                onChange={e => set('capacity', parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DoorOpen size={14} /> Waitlist Limit
              </label>
              <input
                required
                type="number"
                min="0"
                className="input"
                style={{ padding: '10px 12px', borderRadius: '8px' }}
                value={formData.waitlist_limit}
                onChange={e => set('waitlist_limit', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ background: 'var(--border)' }} />

        {/* ── Right Column: Scheduling ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h4
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              margin: 0,
              paddingBottom: '4px',
            }}
          >
            Scheduling & Booking
          </h4>

          {/* Event Date — shadcn Calendar */}
          <DatePickerField
            label="Event Date"
            icon={CalendarDays}
            value={eventDate}
            onChange={setEventDate}
          />

          <div className="form-group">
            <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} /> Time Slot
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {TIME_SLOTS.map(slot => (
                <button
                  type="button"
                  key={slot.value}
                  onClick={() => set('time_slot', slot.value)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '7px',
                    border: `1px solid ${formData.time_slot === slot.value ? 'var(--accent)' : 'var(--border)'}`,
                    background: formData.time_slot === slot.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    color: formData.time_slot === slot.value ? 'var(--accent)' : 'inherit',
                    fontWeight: formData.time_slot === slot.value ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.78rem',
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

          {/* Booking Opens — shadcn Calendar + time */}
          <DateTimePickerField
            label="Booking Opens"
            icon={CalendarDays}
            value={bookingOpen}
            onChange={setBookingOpen}
          />

          {/* Booking Closes — shadcn Calendar + time */}
          <DateTimePickerField
            label="Booking Closes"
            icon={CalendarDays}
            value={bookingClose}
            onChange={setBookingClose}
          />
        </div>

        {/* ── Submit Row ── */}
        <div
          style={{
            gridColumn: '1 / -1',
            marginTop: '16px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 500 }}
            onClick={() => navigate('/admin')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            disabled={createEventMutation.isPending || !formData.time_slot || !eventDate}
          >
            {createEventMutation.isPending ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <>
                <Send size={16} /> Publish Event
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
