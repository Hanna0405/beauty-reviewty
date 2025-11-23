'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { sendBooking } from '@/lib/bookingClient';
import toast from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import { requireDb } from '@/lib/firebase';

type WorkingHours = {
  start?: string | null;
  end?: string | null;
};

type Props = {
  listingId: string;
  masterUid: string;
  onSuccess?: () => void;
  workingHours?: WorkingHours | null;
};

export default function BookingForm({ listingId, masterUid, onSuccess, workingHours }: Props) {
  const [date, setDate] = useState(''); // '2025-09-30'
  const [time, setTime] = useState(''); // '17:28'
  const [durationMin, setDurationMin] = useState<number | ''>(60);
  const [note, setNote] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [offDays, setOffDays] = useState<string[]>([]); // Master's non-working days
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Load master's off days
  useEffect(() => {
    if (!masterUid) return;
    
    let cancelled = false;
    (async () => {
      try {
        const db = requireDb();
        if (!db) return;
        
        const profileSnap = await getDoc(doc(db, "profiles", masterUid));
        if (cancelled) return;
        
        if (profileSnap.exists()) {
          const profile = profileSnap.data() as any;
          const masterOffDays = Array.isArray(profile?.offDays)
            ? profile.offDays.filter((d: any) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))
            : [];
          if (!cancelled) {
            setOffDays(masterOffDays);
          }
        }
      } catch (error) {
        console.error('[BookingForm] Error loading master off days:', error);
      }
    })();
    
    return () => {
      cancelled = true;
    };
  }, [masterUid]);

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCalendar]);

  // Helper to check if a date string (YYYY-MM-DD) is an off day
  const isDateDisabled = useMemo(() => {
    return (dateStr: string): boolean => {
      if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
      return offDays.includes(dateStr);
    };
  }, [offDays]);

  // Helper to check if a Date object is an off day
  const isOffDay = useMemo(() => {
    return (date: Date): boolean => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const key = `${y}-${m}-${d}`;
      return offDays.includes(key);
    };
  }, [offDays]);

  // Helper to parse time string to minutes since midnight
  const parseTimeToMinutes = useMemo(() => {
    return (timeStr: string): number | null => {
      if (!timeStr) return null;
      const parts = timeStr.split(":");
      if (parts.length !== 2) return null;
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (isNaN(h) || isNaN(m)) return null;
      return h * 60 + m;
    };
  }, []);

  // Check if selected time is within working hours
  const timeError = useMemo(() => {
    if (!time || !workingHours || !workingHours.start || !workingHours.end) return null;
    
    const selectedMinutes = parseTimeToMinutes(time);
    const startMinutes = parseTimeToMinutes(workingHours.start);
    const endMinutes = parseTimeToMinutes(workingHours.end);
    
    if (selectedMinutes === null || startMinutes === null || endMinutes === null) {
      return null; // Invalid time format, will be caught by required validation
    }
    
    if (selectedMinutes < startMinutes || selectedMinutes > endMinutes) {
      return `This time is outside master's working hours (${workingHours.start} - ${workingHours.end}).`;
    }
    
    return null;
  }, [time, workingHours, parseTimeToMinutes]);

  const missing = useMemo(() => !date || !time || !masterUid || !durationMin, [date, time, masterUid, durationMin]);
  
  // Check if selected date is an off day
  const dateError = useMemo(() => {
    if (!date) return null;
    if (isDateDisabled(date)) {
      return 'This master is not available on this date. Please select a different date.';
    }
    return null;
  }, [date, isDateDisabled]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missing) { setErr('Missing fields'); return; }
    
    // Validate date is not an off day
    if (dateError) {
      setErr(dateError);
      return;
    }
    
    if (isDateDisabled(date)) {
      setErr('This master is not available on this date. Please select a different date.');
      return;
    }
    
    // Validate time is within working hours
    if (timeError) {
      setErr(timeError);
      return;
    }
    
    if (workingHours && workingHours.start && workingHours.end && time) {
      const selectedMinutes = parseTimeToMinutes(time);
      const startMinutes = parseTimeToMinutes(workingHours.start);
      const endMinutes = parseTimeToMinutes(workingHours.end);
      
      if (selectedMinutes !== null && startMinutes !== null && endMinutes !== null) {
        if (selectedMinutes < startMinutes || selectedMinutes > endMinutes) {
          setErr(`This time is outside master's working hours (${workingHours.start} - ${workingHours.end}).`);
          return;
        }
      }
    }
    
    setErr(null);
    setLoading(true);
    try {
      const res = await sendBooking({
        listingId,
        masterId: masterUid,
        date, 
        time, 
        duration: Number(durationMin), 
        note, 
        contactName: clientName, 
        contactPhone: clientPhone,
      });
      setSent(true);
      toast.success("Booking request sent!");
      // Close shortly after success
      setTimeout(() => {
        setDate('');
        setTime('');
        setDurationMin(60);
        setNote('');
        setClientName('');
        setClientPhone('');
        setSent(false);
        onSuccess?.();
      }, 1200);
    } catch (e: any) {
      setErr(e.message ?? 'Failed to send');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md border border-pink-100">
      <form onSubmit={onSubmit} className="space-y-4">
        {/* DATE */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Date</label>
          <div className="relative" ref={calendarRef}>
            <input
              type="text"
              readOnly
              className={`input w-full cursor-pointer ${dateError ? 'border-red-500' : ''}`}
              value={date ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }) : ''}
              placeholder="Select a date"
              onClick={() => setShowCalendar(!showCalendar)}
              required
            />
            {showCalendar && <DatePickerCalendar 
              selectedDate={date}
              onSelect={(dateStr) => {
                setDate(dateStr);
                setShowCalendar(false);
                setErr(null);
              }}
              offDays={offDays}
              isOffDay={isOffDay}
            />}
          </div>
          {dateError && (
            <p className="text-xs text-red-600">{dateError}</p>
          )}
        </div>
        {/* TIME */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Time</label>
          {workingHours ? (
            <>
              <select
                className={`input w-full ${timeError ? 'border-red-500' : ''}`}
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setErr(null); // Clear error when time changes
                }}
                required
              >
              <option value="">Select time</option>
              {(() => {
                if (!workingHours.start || !workingHours.end) {
                  return [];
                }
                const startMinutes = parseTimeToMinutes(workingHours.start);
                const endMinutes = parseTimeToMinutes(workingHours.end);
                
                if (startMinutes === null || endMinutes === null) {
                  return [];
                }
                
                const timeOptions: string[] = [];
                
                // Round start up to next 30-minute interval if needed
                let currentMinutes = startMinutes;
                if (startMinutes % 30 !== 0) {
                  currentMinutes = Math.ceil(startMinutes / 30) * 30;
                }
                
                // Round end down to previous 30-minute interval if needed
                let lastValidMinutes = endMinutes;
                if (endMinutes % 30 !== 0) {
                  lastValidMinutes = Math.floor(endMinutes / 30) * 30;
                }
                
                // Generate 30-minute intervals from rounded start to rounded end
                for (let minutes = currentMinutes; minutes <= lastValidMinutes; minutes += 30) {
                  const h = Math.floor(minutes / 60);
                  const m = minutes % 60;
                  const hourStr = String(h).padStart(2, "0");
                  const minuteStr = String(m).padStart(2, "0");
                  timeOptions.push(`${hourStr}:${minuteStr}`);
                }
                
                return timeOptions.map((timeOption) => (
                  <option key={timeOption} value={timeOption}>
                    {timeOption}
                  </option>
                ));
              })()}
              </select>
              {timeError && (
                <p className="text-xs text-red-600">{timeError}</p>
              )}
            </>
          ) : (
            <>
              <input 
                type="time" 
                className={`input w-full ${timeError ? 'border-red-500' : ''}`}
                value={time} 
                onChange={(e) => {
                  setTime(e.target.value);
                  setErr(null); // Clear error when time changes
                }}
                min={undefined}
                max={undefined}
                required 
              />
              {timeError && (
                <p className="text-xs text-red-600">{timeError}</p>
              )}
            </>
          )}
        </div>
        {/* DURATION */}
        <input 
          type="number" 
          min={10} 
          step={5} 
          className="input w-full"
          value={durationMin} 
          onChange={e=>setDurationMin(Number(e.target.value)||'')} 
          placeholder="Duration (min)" 
          required 
        />
        {/* NOTE */}
        <textarea 
          className="textarea w-full" 
          rows={3}
          value={note} 
          onChange={e=>setNote(e.target.value)} 
          placeholder="Note (optional)" 
        />
        {/* Optional contact */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input 
            className="input w-full" 
            placeholder="Your name (optional)"
            value={clientName} 
            onChange={e=>setClientName(e.target.value)} 
          />
          <input 
            className="input w-full" 
            placeholder="Phone (optional)"
            value={clientPhone} 
            onChange={e=>setClientPhone(e.target.value)} 
          />
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {sent && <p className="text-sm text-green-600">Request sent ✔️</p>}

        <button 
          type="submit" 
          disabled={loading || !!missing}
          className={`bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg w-full transition ${loading || missing ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Sending…' : 'Send request'}
        </button>
      </form>
    </div>
  );
}

// Simple calendar component for date selection
function DatePickerCalendar({ 
  selectedDate, 
  onSelect, 
  offDays, 
  isOffDay 
}: { 
  selectedDate: string; 
  onSelect: (dateStr: string) => void; 
  offDays: string[];
  isOffDay: (date: Date) => boolean;
}) {
  // Initialize month to selected date or current month
  const initialMonth = selectedDate 
    ? new Date(selectedDate + 'T12:00:00')
    : new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
  
  const days: Date[] = [];
  const date = new Date(startDate);
  for (let i = 0; i < 42; i++) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const handleDayClick = (day: Date) => {
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, "0");
    const d = String(day.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    
    // Don't allow selecting past dates or off days
    if (day < today || offDays.includes(dateStr)) {
      return;
    }
    
    onSelect(dateStr);
  };
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const selectedDateObj = selectedDate ? new Date(selectedDate + 'T12:00:00') : null;
  
  return (
    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-full max-w-sm">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 hover:bg-gray-100 rounded"
          aria-label="Previous month"
        >
          ←
        </button>
        <h3 className="font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 hover:bg-gray-100 rounded"
          aria-label="Next month"
        >
          →
        </button>
      </div>
      
      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 p-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const y = day.getFullYear();
          const m = String(day.getMonth() + 1).padStart(2, "0");
          const d = String(day.getDate()).padStart(2, "0");
          const dateStr = `${y}-${m}-${d}`;
          
          const isPast = day < today;
          const isOff = isOffDay(day);
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isSelected = selectedDateObj && 
            day.getFullYear() === selectedDateObj.getFullYear() &&
            day.getMonth() === selectedDateObj.getMonth() &&
            day.getDate() === selectedDateObj.getDate();
          
          const isDisabled = isPast || isOff;
          
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleDayClick(day)}
              disabled={isDisabled}
              className={`
                relative p-2 text-sm rounded transition-colors
                ${!isCurrentMonth ? 'text-gray-300' : ''}
                ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-pink-50 cursor-pointer'}
                ${isSelected ? 'bg-pink-500 text-white font-semibold' : ''}
                ${!isSelected && isCurrentMonth && !isDisabled ? 'text-gray-700' : ''}
                ${day.getDate() === today.getDate() && 
                  day.getMonth() === today.getMonth() && 
                  day.getFullYear() === today.getFullYear() && 
                  !isSelected ? 'ring-1 ring-pink-500' : ''}
              `}
            >
              {day.getDate()}
              {isOff && (
                <div 
                  className="absolute inset-0 pointer-events-none flex items-center justify-center"
                  style={{ transform: 'rotate(-18deg)' }}
                >
                  <div className="w-full h-0.5 bg-red-500 opacity-80" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
