'use client';
import { useEffect, useState } from 'react';
import { addDoc, collection, doc, getDoc, serverTimestamp, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { useAuth } from '@/contexts/AuthContext';
import { createReview } from '@/lib/reviews';
import type { CommunityMaster } from '@/types/community';
import AutocompleteList from '@/components/AutocompleteList';
import { CityAutocomplete, ServicesSelect, LanguagesSelect } from '@/components/selects';
import { SERVICES_OPTIONS, LANGUAGE_OPTIONS } from '@/constants/options';

function slugifyCityName(name: string) {
 return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

type PresetMaster = {
  id: string;
  displayName?: string;
  slug?: string;
  city?: string;
  services?: string[];
  contact?: any;
};

type Props = {
  open?: boolean;
  onClose?: () => void;
  presetMaster?: PresetMaster;
};

export default function ReviewtyCreateModal({ open: controlledOpen, onClose, presetMaster }: Props = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { user } = useAuth();
  
  // Use controlled open if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOpen !== undefined ? (onClose || (() => {})) : setInternalOpen;

  // open/close via custom event (only if not controlled)
  useEffect(() => {
    if (controlledOpen === undefined) {
      const onOpen = () => setInternalOpen(true);
      window.addEventListener('reviewty:openCreate', onOpen);
      return () => window.removeEventListener('reviewty:openCreate', onOpen);
    }
  }, [controlledOpen]);

  const [mode, setMode] = useState<'listing'|'community'>('listing');

  // Pre-fill form when preset master is provided
  useEffect(() => {
    if (presetMaster && open) {
      setMode('community');
      setCM({
        displayName: presetMaster.displayName || '',
        city: presetMaster.city || '',
        services: presetMaster.services || [],
        contact: presetMaster.contact || {}
      });
      setCity(presetMaster.city || '');
      setSelectedServices(
        (presetMaster.services || []).map(s => ({
          value: s,
          label: SERVICES_OPTIONS.find(opt => opt.value === s)?.label || s
        }))
      );
    }
  }, [presetMaster, open]);

 // listing id selected
 const [listingId, setListingId] = useState('');
 const [listingQuery, setListingQuery] = useState('');
 const [listingOpts, setListingOpts] = useState<{id:string; title:string; city?:string; services?:string[]; photoUrl?:string}[]>([]);
 const [loadingListings, setLoadingListings] = useState(false);
 // minimal community master
 const [cm, setCM] = useState<Partial<CommunityMaster>>({ city:'', displayName:'', services:[] });
 
 // structured form state for community master
 const [city, setCity] = useState<string>('');
 const [selectedServices, setSelectedServices] = useState<{value:string;label:string}[]>([]);
 const [selectedLanguages, setSelectedLanguages] = useState<{value:string;label:string}[]>([]);

 // review form
 const [rating, setRating] = useState<1|2|3|4|5>(5);
 const [text, setText] = useState('');
 const [files, setFiles] = useState<File[]>([]);

 useEffect(() => {
 let off = false;
 async function load() {
 setLoadingListings(true);
 try {
 const q = query(collection(db, 'listings'), orderBy('updatedAt','desc'), limit(100));
 const snap = await getDocs(q);
 if (off) return;
 const rows = snap.docs.map(d => {
 const x: any = d.data();
 return {
 id: d.id,
 title: x.title || 'Untitled',
 city: x.city || '',
 services: Array.isArray(x.services) ? x.services : [],
 photoUrl: x?.photos?.[0]?.url || '',
 };
 });
 setListingOpts(rows);
 } finally {
 if (!off) setLoadingListings(false);
 }
 }
 load();
 return () => { off = true; };
 }, []);

 async function upload(file: File) {
 const fd = new FormData(); fd.append('file', file);
 const res = await fetch('/api/upload?folder=reviews', { method:'POST', body: fd });
 if (!res.ok) throw new Error('Upload failed');
 return res.json() as Promise<{url:string; path:string}>;
 }

 async function handleSubmit() {
 if (!user) return alert('Log in first');
 let masterRef: any = null;
 let city = '';
 let services: string[] = [];

 if (mode === 'listing' && listingId) {
 const snap = await getDoc(doc(db, 'listings', listingId));
 if (!snap.exists()) return alert('Listing not found');
 const data = snap.data() as any;
 masterRef = { type:'listing', id: listingId };
 city = data.city || '';
 services = Array.isArray(data.services) ? data.services : [];
 } else {
 // create community master
 const slug = `m-${slugifyCityName(city || 'city')}-${Math.random().toString(36).slice(2,8)}`;
 const ref = await addDoc(collection(db, 'community_masters'), {
 slug,
 displayName: cm.displayName?.trim() || 'Master',
 city: city || '',
 services: selectedServices.map(s => s.value),
 languages: selectedLanguages.map(l => l.value),
 contact: cm.contact || {},
 createdByUid: user.uid,
 createdAt: serverTimestamp(),
 claimedListingId: null,
 });
 masterRef = { type:'community', id: ref.id, slug };
 city = city || '';
 services = selectedServices.map(s => s.value);
 }

 // upload photos (max 3)
 const photos = [];
 for (const f of files.slice(0,3)) {
 photos.push(await upload(f));
 }

 await createReview({
 listingId: mode === 'listing' ? listingId : '',
 authorId: user.uid,
 rating,
 text,
 photos,
 // denormalized:
 city,
 services,
 languages: selectedLanguages.map(l => l.value),
 masterRef,
 isPublic: true,
 });

 setOpen(false);
 setListingId(''); setCM({}); setFiles([]); setText(''); setRating(5);
 setCity(''); setSelectedServices([]); setSelectedLanguages([]);
 }

 if (!open) return null;

 return (
 <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
 <div className="w-full max-w-xl rounded-xl bg-white p-6 space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-semibold">Add review</h3>
 <button onClick={()=>setOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
 </div>

 <div className="flex gap-3 text-sm">
 <button onClick={()=>setMode('listing')} className={`px-3 py-1.5 rounded ${mode==='listing'?'bg-pink-100 text-pink-700':'bg-gray-100'}`}>Existing master</button>
 <button onClick={()=>setMode('community')} className={`px-3 py-1.5 rounded ${mode==='community'?'bg-pink-100 text-pink-700':'bg-gray-100'}`}>Create public card</button>
 </div>

 {mode === 'listing' ? (
 <div className="space-y-2">
 <p className="text-sm text-gray-600">Find master by name, city or service:</p>
 <AutocompleteList
 value={listingQuery}
 onSelect={(opt)=>{ setListingId(opt.id); setListingQuery(`${opt.title} — ${opt.city}`); }}
 options={listingOpts}
 placeholder="e.g.: Anna Nails Toronto"
 />
 {!!listingId && <div className="text-xs text-green-700">Selected: {listingQuery}</div>}
 {loadingListings && <div className="text-xs text-gray-500">Loading masters…</div>}
 </div>
 ) : (
 <div className="space-y-3">
 {/* Name / City row */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <input
 className="w-full rounded border px-3 py-2"
 placeholder="Name / nickname / salon"
 value={cm.displayName || ""}
 onChange={(e) => setCM((v:any) => ({ ...v, displayName: e.target.value }))}
 />

 <CityAutocomplete
 value={city}
 placeholder="City"
 autoOpenOnType={true}
 autoCloseOnSelect={true}
 onChange={(c: string) => setCity(c)}
 />
 </div>

 {/* Services */}
 <ServicesSelect
 value={selectedServices.map(s => s.value)}
 onChange={(vals: string[]) => {
 const serviceOptions = vals.map(value => ({
 value,
 label: SERVICES_OPTIONS.find(s => s.value === value)?.label || value
 }));
 setSelectedServices(serviceOptions);
 }}
 options={SERVICES_OPTIONS}
 placeholder="Services (start typing...)"
 autoOpenOnType={true}
 autoCloseOnSelect={true}
 />

 {/* Languages */}
 <LanguagesSelect
 value={selectedLanguages.map(l => l.value)}
 onChange={(vals: string[]) => {
 const languageOptions = vals.map(value => ({
 value,
 label: LANGUAGE_OPTIONS.find(l => l.value === value)?.label || value
 }));
 setSelectedLanguages(languageOptions);
 }}
 options={LANGUAGE_OPTIONS}
 placeholder="Languages"
 autoOpenOnType={true}
 autoCloseOnSelect={true}
 />
 </div>
 )}

 <div className="grid gap-3">
 <div className="flex items-center gap-2">
 <span className="text-sm text-gray-600">Your rating:</span>
 <select value={rating} onChange={(e)=>setRating(Number(e.target.value) as any)} className="rounded border p-1">
 {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
 </select>
 <span className="text-yellow-400">{'★'.repeat(rating)}</span>
 </div>
 <textarea value={text} onChange={(e)=>setText(e.target.value)} rows={3} placeholder="Describe your experience..." className="rounded border p-2" />
 <input type="file" accept="image/*" multiple onChange={(e)=>{const arr=Array.from(e.target.files||[]).slice(0,3); setFiles(arr);}} />
 </div>

 <div className="flex justify-end">
 <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700">Submit</button>
 </div>
 </div>
 </div>
 );
}
