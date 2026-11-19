import { useState, useEffect, useRef, useMemo } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type EventType = 'milestone' | 'break' | 'activity' | 'development' | 'presentation'

interface ScheduleItem {
  id: string
  datetime: string
  title: string
  description?: string
  type: EventType
}

interface HackathonConfig {
  eventName: string
  tagline: string
  venue: string
  startTime: string
  endTime: string
}

// ── Config ────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: HackathonConfig = {
  eventName: 'MakeMu 2026',
  tagline: 'From Idea to Product',
  venue: 'Admin Block Seminar Hall, GEC Idukki',
  startTime: '2026-09-26T15:00:00',
  endTime: '2026-09-27T15:00:00',
}

const TYPE_CFG: Record<EventType, { color: string; bg: string; border: string; label: string }> = {
  milestone:    { color: '#a78bfa', bg: 'rgba(124,58,237,0.13)', border: 'rgba(124,58,237,0.35)', label: 'Milestone' },
  break:        { color: '#34d399', bg: 'rgba(0,201,167,0.09)',  border: 'rgba(0,201,167,0.28)',  label: 'Break' },
  activity:     { color: '#fbbf24', bg: 'rgba(245,158,11,0.09)', border: 'rgba(245,158,11,0.28)', label: 'Activity' },
  development:  { color: '#93c5fd', bg: 'rgba(96,165,250,0.09)', border: 'rgba(96,165,250,0.28)', label: 'Dev' },
  presentation: { color: '#fb7185', bg: 'rgba(244,63,94,0.13)',  border: 'rgba(244,63,94,0.32)',  label: 'Presentation' },
}

const INITIAL_ITEMS: ScheduleItem[] = [
  { id:'1',  datetime:'2026-09-26T14:00:00', title:'Registration & Check-In',           description:'Arrive at the Admin Block Seminar Hall, register your team, and get settled.',          type:'milestone' },
  { id:'2',  datetime:'2026-09-26T15:00:00', title:'Hackathon Begins',                   description:'Official start · Briefing · Rules · Judging criteria revealed.',                        type:'milestone' },
  { id:'3',  datetime:'2026-09-26T15:30:00', title:'Ice Breaker',                        description:'A warm-up activity to spark connections and loosen creative gears.',                     type:'activity' },
  { id:'4',  datetime:'2026-09-26T16:00:00', title:'Problem Identification Sprint',      description:'Define your users, map the problem space, and lock in your solution scope.',            type:'development' },
  { id:'5',  datetime:'2026-09-26T17:00:00', title:'Tea Break',                          description:'A refreshing pause before the evening sprint.',                                          type:'break' },
  { id:'6',  datetime:'2026-09-26T18:30:00', title:'Collaborative Puzzle',               description:'A cross-team creative challenge to keep energy high and ideas flowing.',                type:'activity' },
  { id:'7',  datetime:'2026-09-26T19:00:00', title:'Core Development',                   description:'Build, prototype, and iterate on your product with the full team.',                     type:'development' },
  { id:'8',  datetime:'2026-09-26T20:30:00', title:'Dinner',                             description:'Recharge with a proper meal before the night sprint.',                                  type:'break' },
  { id:'9',  datetime:'2026-09-26T22:00:00', title:'Team Game',                          description:'An energizing group activity before the all-night sprint.',                             type:'activity' },
  { id:'10', datetime:'2026-09-26T22:30:00', title:'MVP Development',                    description:'Focused sprint — nail your core product functionality.',                                type:'development' },
  { id:'11', datetime:'2026-09-27T01:00:00', title:'Short Energy Game',                  description:"Quick recharge — don't let momentum drop at the hardest hour.",                       type:'activity' },
  { id:'12', datetime:'2026-09-27T01:30:00', title:'Core Development & Testing',         description:'Deep work. Build, test, fix. This is where real products are made.',                   type:'development' },
  { id:'13', datetime:'2026-09-27T04:00:00', title:'Relaxation / Game Break',            description:'Breathe. Stretch. Play. A short reset before the final push.',                        type:'activity' },
  { id:'14', datetime:'2026-09-27T06:00:00', title:'Biscuit & Tea Break',                description:'Light refreshments to start the final morning.',                                        type:'break' },
  { id:'15', datetime:'2026-09-27T06:30:00', title:'Integration & Debugging',            description:'Connect all the pieces, squash the bugs, and polish the user flow.',                   type:'development' },
  { id:'16', datetime:'2026-09-27T08:30:00', title:'Breakfast',                          description:'Fuel up for the final stretch.',                                                        type:'break' },
  { id:'17', datetime:'2026-09-27T10:00:00', title:'Product-Focused Game',               description:'A creative activity to sharpen your thinking and refine your pitch.',                  type:'activity' },
  { id:'18', datetime:'2026-09-27T10:30:00', title:'Final Development & Peer Feedback',  description:'Last-mile polish. Fresh eyes from other teams on your product.',                       type:'development' },
  { id:'19', datetime:'2026-09-27T12:30:00', title:'Lunch',                              description:'Final meal before presentations.',                                                      type:'break' },
  { id:'20', datetime:'2026-09-27T13:30:00', title:'Final Presentations',                description:'Demo your product to the judges. 24 hours of work, one moment to shine.',             type:'presentation' },
  { id:'21', datetime:'2026-09-27T15:00:00', title:'Official Closing',                   description:'Results announced. Prizes awarded. 24 hours of building, celebrated.',                 type:'milestone' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPeriod(dt: string): { period: string; icon: string } {
  const d = new Date(dt), date = d.getDate(), h = d.getHours()
  if (date === 26) return h < 18 ? { period:'Afternoon · Sep 26', icon:'☀️' } : { period:'Evening · Sep 26', icon:'🌇' }
  if (h < 6)  return { period:'Night · Sep 26–27', icon:'🌙' }
  if (h < 12) return { period:'Morning · Sep 27', icon:'🌅' }
  return { period:'Finale · Sep 27', icon:'🏁' }
}

function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true })
}

function fmtDateTime(dt: string) {
  const d = new Date(dt)
  return d.toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit', hour12:true })
}

function pad(n: number) { return String(n).padStart(2, '0') }

function fmtClock(ms: number) {
  const s = Math.floor(ms / 1000)
  return { h: pad(Math.floor(s / 3600)), m: pad(Math.floor((s % 3600) / 60)), s: pad(s % 60) }
}

function fmtRel(dt: string, now: Date): string {
  const diff = new Date(dt).getTime() - now.getTime()
  const abs  = Math.abs(diff)
  const mins = Math.floor(abs / 60000)
  const hrs  = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (diff > 0) {
    if (days > 0)  return `in ${days}d ${hrs % 24}h`
    if (hrs > 0)   return `in ${hrs}h ${mins % 60}m`
    if (mins > 0)  return `in ${mins}m`
    return `in <1m`
  } else {
    if (hrs > 0)   return `${hrs}h ${mins % 60}m ago`
    if (mins > 0)  return `${mins}m ago`
    return `just now`
  }
}

// ── Countdown Config Modal ────────────────────────────────────────────────────

function ConfigModal({ config, onSave, onClose }: {
  config: HackathonConfig
  onSave: (c: HackathonConfig) => void
  onClose: () => void
}) {
  const parseISO = (iso: string) => {
    const d = new Date(iso)
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    }
  }

  const s0 = parseISO(config.startTime)
  const e0 = parseISO(config.endTime)

  const [name,     setName]     = useState(config.eventName)
  const [tagline,  setTagline]  = useState(config.tagline)
  const [venue,    setVenue]    = useState(config.venue)
  const [startDate,setStartDate]= useState(s0.date)
  const [startTime,setStartTime]= useState(s0.time)
  const [endDate,  setEndDate]  = useState(e0.date)
  const [endTime,  setEndTime]  = useState(e0.time)

  function save() {
    onSave({
      eventName: name.trim() || config.eventName,
      tagline:   tagline.trim(),
      venue:     venue.trim(),
      startTime: `${startDate}T${startTime}:00`,
      endTime:   `${endDate}T${endTime}:00`,
    })
  }

  const inputCls = "w-full px-3 py-2.5 rounded-lg border text-white text-sm outline-none transition-colors placeholder-[#3a4260]"
  const inputStyle = { backgroundColor:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.1)', fontFamily:'var(--font-body)' }
  const labelCls = "block mb-1.5 text-xs font-medium"
  const labelStyle = { fontFamily:'var(--font-mono)', color:'var(--color-muted)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor:'rgba(0,0,0,0.85)', backdropFilter:'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-2xl border p-6 animate-fade-up max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor:'#080c18', borderColor:'rgba(124,58,237,0.3)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white" style={{ fontFamily:'var(--font-display)' }}>Customize Countdown</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-sm" style={{ color:'var(--color-muted)' }}>✕</button>
        </div>

        <label className={labelCls} style={labelStyle}>Event Name</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="MakeMu 2026" className={`${inputCls} mb-4`} style={inputStyle} />

        <label className={labelCls} style={labelStyle}>Tagline</label>
        <input value={tagline} onChange={e=>setTagline(e.target.value)} placeholder="From Idea to Product" className={`${inputCls} mb-4`} style={inputStyle} />

        <label className={labelCls} style={labelStyle}>Venue</label>
        <input value={venue} onChange={e=>setVenue(e.target.value)} placeholder="Venue name" className={`${inputCls} mb-5`} style={inputStyle} />

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className={labelCls} style={labelStyle}>Start Date</label>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className={inputCls} style={{ ...inputStyle, colorScheme:'dark' }} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Start Time</label>
            <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className={inputCls} style={{ ...inputStyle, colorScheme:'dark', fontFamily:'var(--font-mono)' }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <label className={labelCls} style={labelStyle}>End Date</label>
            <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className={inputCls} style={{ ...inputStyle, colorScheme:'dark' }} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>End Time</label>
            <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className={inputCls} style={{ ...inputStyle, colorScheme:'dark', fontFamily:'var(--font-mono)' }} />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium border hover:bg-white/5 transition-all"
            style={{ color:'var(--color-muted)', borderColor:'rgba(255,255,255,0.08)', backgroundColor:'transparent' }}>Cancel</button>
          <button onClick={save} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all"
            style={{ backgroundColor:'#7c3aed' }}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ── Schedule Edit Modal ───────────────────────────────────────────────────────

function EditModal({ item, onSave, onDelete, onClose }: {
  item: ScheduleItem | null
  onSave: (item: ScheduleItem) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const isNew = !item
  const dt0 = item ? new Date(item.datetime) : new Date('2026-09-26T15:00:00')

  const [title, setTitle]   = useState(item?.title ?? '')
  const [desc,  setDesc]    = useState(item?.description ?? '')
  const [type,  setType]    = useState<EventType>(item?.type ?? 'development')
  const [day,   setDay]     = useState<'26'|'27'>(String(dt0.getDate()) as '26'|'27')
  const [time,  setTime]    = useState(`${pad(dt0.getHours())}:${pad(dt0.getMinutes())}`)

  function save() {
    if (!title.trim()) return
    onSave({
      id: item?.id ?? crypto.randomUUID(),
      datetime: `2026-09-${day}T${time}:00`,
      title: title.trim(),
      description: desc.trim() || undefined,
      type,
    })
  }

  const iCls  = "w-full px-3 py-2.5 rounded-lg border text-white text-sm outline-none transition-colors"
  const iStyle = { backgroundColor:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.1)', fontFamily:'var(--font-body)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor:'rgba(0,0,0,0.82)', backdropFilter:'blur(10px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-2xl border p-6 animate-fade-up"
        style={{ backgroundColor:'#080c18', borderColor:'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white" style={{ fontFamily:'var(--font-display)' }}>{isNew ? 'Add Event' : 'Edit Event'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-sm" style={{ color:'var(--color-muted)' }}>✕</button>
        </div>

        <label className="block mb-1.5 text-xs font-medium" style={{ fontFamily:'var(--font-mono)', color:'var(--color-muted)' }}>Title *</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Event name" className={`${iCls} mb-4`} style={iStyle} />

        <label className="block mb-1.5 text-xs font-medium" style={{ fontFamily:'var(--font-mono)', color:'var(--color-muted)' }}>Date</label>
        <div className="flex gap-2 mb-4">
          {(['26','27'] as const).map(d => (
            <button key={d} onClick={()=>setDay(d)} className="flex-1 py-2 rounded-lg text-sm font-medium border transition-all"
              style={{ backgroundColor:day===d?'rgba(124,58,237,0.2)':'rgba(255,255,255,0.03)', borderColor:day===d?'rgba(124,58,237,0.5)':'rgba(255,255,255,0.08)', color:day===d?'#a78bfa':'var(--color-muted)' }}>
              Sep {d}
            </button>
          ))}
        </div>

        <label className="block mb-1.5 text-xs font-medium" style={{ fontFamily:'var(--font-mono)', color:'var(--color-muted)' }}>Time</label>
        <input type="time" value={time} onChange={e=>setTime(e.target.value)} className={`${iCls} mb-4`} style={{ ...iStyle, colorScheme:'dark', fontFamily:'var(--font-mono)' }} />

        <label className="block mb-1.5 text-xs font-medium" style={{ fontFamily:'var(--font-mono)', color:'var(--color-muted)' }}>Type</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.entries(TYPE_CFG) as [EventType, typeof TYPE_CFG[EventType]][]).map(([t,c]) => (
            <button key={t} onClick={()=>setType(t)} className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={{ backgroundColor:type===t?c.bg:'transparent', borderColor:type===t?c.border:'rgba(255,255,255,0.07)', color:type===t?c.color:'var(--color-muted)' }}>
              {c.label}
            </button>
          ))}
        </div>

        <label className="block mb-1.5 text-xs font-medium" style={{ fontFamily:'var(--font-mono)', color:'var(--color-muted)' }}>Description <span style={{ color:'#252c42' }}>(optional)</span></label>
        <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Brief description..." rows={2}
          className={`${iCls} mb-6 resize-none`} style={iStyle} />

        <div className="flex gap-3">
          {!isNew && (
            <button onClick={()=>{ onDelete(item!.id); onClose() }} className="px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-rose-500/10 transition-all"
              style={{ color:'#fb7185', borderColor:'rgba(244,63,94,0.3)', backgroundColor:'transparent' }}>Delete</button>
          )}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium border hover:bg-white/5 transition-all"
            style={{ color:'var(--color-muted)', borderColor:'rgba(255,255,255,0.07)', backgroundColor:'transparent' }}>Cancel</button>
          <button onClick={save} disabled={!title.trim()} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-all"
            style={{ backgroundColor:'#7c3aed' }}>{isNew ? 'Add Event' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Journey phases ────────────────────────────────────────────────────────────

const JOURNEY = [
  { label:'Problem', num:'01', color:'#7c3aed' },
  { label:'Idea',    num:'02', color:'#9333ea' },
  { label:'Build',   num:'03', color:'#00c9a7' },
  { label:'Test',    num:'04', color:'#0891b2' },
  { label:'Improve', num:'05', color:'#f59e0b' },
  { label:'Present', num:'06', color:'#f43f5e' },
  { label:'Product', num:'07', color:'#60a5fa' },
]

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [now,       setNow]       = useState(() => new Date())
  const [items,     setItems]     = useState<ScheduleItem[]>(INITIAL_ITEMS)
  const [config,    setConfig]    = useState<HackathonConfig>(DEFAULT_CONFIG)
  const [editing,   setEditing]   = useState<ScheduleItem | 'new' | null>(null)
  const [showCfg,   setShowCfg]   = useState(false)
  const currentRef                = useRef<HTMLDivElement>(null)
  const prevIdx                   = useRef(-2)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const sorted = useMemo(() =>
    [...items].sort((a, b) => a.datetime.localeCompare(b.datetime)), [items])

  const hackathonStart = useMemo(() => new Date(config.startTime), [config.startTime])
  const hackathonEnd   = useMemo(() => new Date(config.endTime),   [config.endTime])

  const phase = now < hackathonStart ? 'before' : now < hackathonEnd ? 'during' : 'after'
  const diff  = Math.max(0, (phase === 'before' ? hackathonStart : hackathonEnd).getTime() - now.getTime())
  const clock = fmtClock(diff)

  const currentIdx = useMemo(() => {
    let idx = -1
    sorted.forEach((item, i) => { if (new Date(item.datetime) <= now) idx = i })
    return idx
  }, [sorted, now])

  useEffect(() => {
    if (phase === 'during' && currentIdx !== prevIdx.current && currentIdx >= 0) {
      prevIdx.current = currentIdx
      setTimeout(() => currentRef.current?.scrollIntoView({ behavior:'smooth', block:'center' }), 400)
    }
  }, [currentIdx, phase])

  const groups = useMemo(() => {
    const map = new Map<string, { icon:string; rows:{ item:ScheduleItem; gi:number }[] }>()
    sorted.forEach((item, gi) => {
      const { period, icon } = getPeriod(item.datetime)
      if (!map.has(period)) map.set(period, { icon, rows:[] })
      map.get(period)!.rows.push({ item, gi })
    })
    return Array.from(map.entries()).map(([period, v]) => ({ period, ...v }))
  }, [sorted])

  function saveItem(item: ScheduleItem) {
    setItems(prev => prev.find(x => x.id === item.id)
      ? prev.map(x => x.id === item.id ? item : x)
      : [...prev, item])
    setEditing(null)
  }

  const curItem  = currentIdx >= 0 ? sorted[currentIdx] : null
  const nextItem = currentIdx >= 0 && currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily:'var(--font-body)', backgroundColor:'var(--color-bg)', color:'var(--color-fg)' }}>

      {/* ════════════════════════════════════════════════════════════════════
          FULL-SCREEN COUNTDOWN
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden grid-bg">

        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] max-w-2xl max-h-2xl rounded-full opacity-[0.12] blur-[120px]"
            style={{ backgroundColor:'#7c3aed', animation:'drift 20s ease-in-out infinite' }} />
          <div className="absolute bottom-[15%] right-[8%] w-[35vw] h-[35vw] max-w-xl max-h-xl rounded-full opacity-[0.1] blur-[100px]"
            style={{ backgroundColor:'#00c9a7', animation:'drift 26s ease-in-out infinite reverse' }} />
        </div>

        {/* ── Nav ── */}
        <nav className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-5 border-b"
          style={{ borderColor:'rgba(255,255,255,0.06)', backgroundColor:'rgba(5,7,14,0.6)', backdropFilter:'blur(20px)' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-widest uppercase" style={{ fontFamily:'var(--font-display)', color:'#a78bfa' }}>
              {config.eventName}
            </span>
            {phase === 'during' && (
              <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
                style={{ fontFamily:'var(--font-mono)', backgroundColor:'rgba(0,201,167,0.1)', color:'#34d399', border:'1px solid rgba(0,201,167,0.25)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse-dot inline-block" />
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {phase === 'during' && curItem && (
              <span className="hidden md:block text-xs truncate max-w-44" style={{ fontFamily:'var(--font-mono)', color:'#34d399' }}>
                {curItem.title}
              </span>
            )}
            <button onClick={() => setShowCfg(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-medium transition-all hover:border-violet-500/40 hover:bg-violet-500/10"
              style={{ color:'#a78bfa', borderColor:'rgba(124,58,237,0.25)', backgroundColor:'transparent', fontFamily:'var(--font-mono)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Edit
            </button>
            <a href="#schedule" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all hover:bg-white/5"
              style={{ color:'var(--color-muted)', fontFamily:'var(--font-mono)' }}>
              Schedule
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            </a>
          </div>
        </nav>

        {/* ── Clock content ── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-12">

          {/* Phase label */}
          {phase === 'before' && (
            <p className="text-xs font-medium tracking-[0.3em] uppercase mb-6 sm:mb-10"
              style={{ fontFamily:'var(--font-mono)', color:'var(--color-muted)' }}>
              Hackathon Begins In
            </p>
          )}
          {phase === 'during' && (
            <div className="mb-6 sm:mb-8 flex flex-col items-center gap-4">
              {/* Current event card */}
              {curItem && (
                <div key={curItem.id} className="animate-pop-in px-6 py-4 rounded-2xl border max-w-sm sm:max-w-md w-full"
                  style={{ backgroundColor:TYPE_CFG[curItem.type].bg, borderColor:TYPE_CFG[curItem.type].border }}>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold"
                      style={{ fontFamily:'var(--font-mono)', color:TYPE_CFG[curItem.type].color }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot inline-block" style={{ backgroundColor:TYPE_CFG[curItem.type].color }} />
                      NOW HAPPENING
                    </span>
                    <span className="text-xs" style={{ fontFamily:'var(--font-mono)', color:'var(--color-muted)' }}>
                      {fmtRel(curItem.datetime, now)}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-white" style={{ fontFamily:'var(--font-display)' }}>{curItem.title}</p>
                  {nextItem && (
                    <p className="text-xs mt-2" style={{ color:'var(--color-muted)' }}>
                      Up next · {nextItem.title}
                      <span className="ml-2" style={{ fontFamily:'var(--font-mono)', color:'rgba(255,255,255,0.3)' }}>
                        {fmtTime(nextItem.datetime)}
                      </span>
                    </p>
                  )}
                </div>
              )}
              <p className="text-xs font-medium tracking-[0.3em] uppercase"
                style={{ fontFamily:'var(--font-mono)', color:'var(--color-muted)' }}>
                Time Remaining
              </p>
            </div>
          )}
          {phase === 'after' && (
            <p className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-10" style={{ fontFamily:'var(--font-display)' }}>
              🏆 Hackathon Complete!
            </p>
          )}

          {/* Big clock digits */}
          {phase !== 'after' ? (
            <div className="flex items-end justify-center gap-2 sm:gap-5 mb-4 sm:mb-6">
              {[{ val:clock.h, label:'Hours' }, { val:clock.m, label:'Minutes' }, { val:clock.s, label:'Seconds' }].map(({ val, label }, i) => (
                <div key={label} className="flex items-end gap-2 sm:gap-5">
                  {i > 0 && (
                    <span className="colon animate-blink pb-6 sm:pb-8"
                      style={{ color: phase === 'during' ? 'rgba(0,201,167,0.35)' : 'rgba(124,58,237,0.35)' }}>
                      :
                    </span>
                  )}
                  <div className="flex flex-col items-center">
                    <span className="digit-block"
                      style={{ color: phase === 'during' ? 'var(--color-teal)' : '#a78bfa' }}>
                      {val}
                    </span>
                    <span className="digit-label">{label}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center mb-8">
              <p className="text-lg" style={{ color:'var(--color-muted)' }}>MakeMu 2026 · Sep 26–27</p>
            </div>
          )}

          {/* Subtitle */}
          <div className="mt-2 sm:mt-4 flex flex-col items-center gap-1">
            {phase === 'before' && (
              <>
                <p className="text-base sm:text-xl font-semibold text-white" style={{ fontFamily:'var(--font-display)' }}>
                  {config.tagline}
                </p>
                <p className="text-sm" style={{ color:'var(--color-muted)' }}>
                  {fmtDateTime(config.startTime)} · {config.venue}
                </p>
              </>
            )}
            {phase === 'during' && (
              <p className="text-sm" style={{ color:'var(--color-muted)' }}>
                Ends {fmtDateTime(config.endTime)}
              </p>
            )}
          </div>

          {/* Progress bar (during phase) */}
          {phase === 'during' && (
            <div className="mt-8 w-full max-w-sm sm:max-w-md">
              <div className="flex justify-between text-xs mb-2" style={{ fontFamily:'var(--font-mono)', color:'var(--color-muted)' }}>
                <span>Start</span>
                <span>{Math.round((now.getTime() - hackathonStart.getTime()) / (hackathonEnd.getTime() - hackathonStart.getTime()) * 100)}% complete</span>
                <span>End</span>
              </div>
              <div className="h-1 rounded-full w-full" style={{ backgroundColor:'rgba(255,255,255,0.07)' }}>
                <div className="h-1 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min(100, (now.getTime() - hackathonStart.getTime()) / (hackathonEnd.getTime() - hackathonStart.getTime()) * 100)}%`,
                    background: 'linear-gradient(to right, #7c3aed, #00c9a7)',
                  }} />
              </div>
            </div>
          )}
        </div>

        {/* Scroll arrow */}
        <div className="relative z-10 flex justify-center pb-8">
          <a href="#schedule" className="flex flex-col items-center gap-2 text-xs transition-all hover:text-white group"
            style={{ color:'var(--color-muted)', fontFamily:'var(--font-mono)' }}>
            <span className="tracking-widest uppercase">Schedule</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="group-hover:translate-y-1 transition-transform">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </a>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background:'linear-gradient(transparent, var(--color-bg))' }} />
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          REAL-TIME SCHEDULE
      ════════════════════════════════════════════════════════════════════ */}
      <section id="schedule" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-medium tracking-widest uppercase"
                  style={{ fontFamily:'var(--font-mono)', color:'#a78bfa' }}>Full Timeline</p>
                {phase === 'during' && (
                  <span className="flex items-center gap-1.5 text-xs"
                    style={{ fontFamily:'var(--font-mono)', color:'#34d399' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse-dot inline-block" />
                    Live
                  </span>
                )}
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-1" style={{ fontFamily:'var(--font-display)' }}>Schedule</h2>
              <p className="text-sm" style={{ color:'var(--color-muted)' }}>
                {fmtDateTime(config.startTime)} → {fmtDateTime(config.endTime)}
              </p>
            </div>
            <button onClick={() => setEditing('new')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm border transition-all hover:border-violet-500/40 hover:bg-violet-500/10 self-start sm:self-auto"
              style={{ color:'#a78bfa', borderColor:'rgba(124,58,237,0.25)', backgroundColor:'transparent' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Add Event
            </button>
          </div>

          {/* Type legend */}
          <div className="flex flex-wrap gap-2 mb-12">
            {(Object.entries(TYPE_CFG) as [EventType, typeof TYPE_CFG[EventType]][]).map(([t,c]) => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full border font-medium"
                style={{ fontFamily:'var(--font-mono)', color:c.color, backgroundColor:c.bg, borderColor:c.border }}>
                {c.label}
              </span>
            ))}
          </div>

          {/* Groups */}
          <div className="space-y-14">
            {groups.map(group => (
              <div key={group.period}>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-2xl">{group.icon}</span>
                  <span className="text-xl font-bold text-white" style={{ fontFamily:'var(--font-display)' }}>{group.period}</span>
                  <div className="flex-1 h-px" style={{ backgroundColor:'var(--color-border)' }} />
                  <span className="text-xs" style={{ color:'var(--color-muted)', fontFamily:'var(--font-mono)' }}>{group.rows.length} events</span>
                </div>

                <div className="relative pl-8">
                  <div className="absolute left-3 top-2 bottom-2 w-px" style={{ backgroundColor:'var(--color-border-2)' }} />
                  <div className="space-y-3">
                    {group.rows.map(({ item, gi }) => {
                      const isCurrent = gi === currentIdx && phase === 'during'
                      const isPast    = gi < currentIdx && phase !== 'before'
                      const isNext    = gi === currentIdx + 1 && phase === 'during'
                      const c = TYPE_CFG[item.type]
                      const rel = fmtRel(item.datetime, now)

                      return (
                        <div key={item.id} ref={isCurrent ? currentRef : undefined}
                          className="relative flex gap-5 group">

                          {/* Dot */}
                          <div className="absolute -left-5 top-4 w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 z-10"
                            style={{
                              backgroundColor: isPast ? 'rgba(255,255,255,0.1)' : c.color,
                              borderColor: 'var(--color-bg)',
                              boxShadow: isCurrent ? `0 0 16px ${c.color}` : 'none',
                              transform: isCurrent ? 'scale(1.6)' : 'scale(1)',
                            }} />
                          {isCurrent && (
                            <div className="absolute -left-5 top-4 w-2.5 h-2.5 rounded-full animate-ping z-0"
                              style={{ backgroundColor:c.color, opacity:0.45 }} />
                          )}

                          {/* Card */}
                          <div className="flex-1 rounded-xl border transition-all duration-300"
                            style={{
                              backgroundColor: isCurrent ? c.bg
                                : isPast ? 'transparent'
                                : item.type === 'break' ? 'transparent'
                                : 'var(--color-surface)',
                              borderColor: isCurrent ? c.border
                                : isPast ? 'rgba(255,255,255,0.03)'
                                : item.type === 'break' ? 'rgba(255,255,255,0.05)'
                                : 'var(--color-border)',
                              opacity: isPast ? 0.4 : 1,
                              boxShadow: isCurrent ? `0 0 32px ${c.color}18` : 'none',
                            }}>
                            <div className={`p-4 ${item.type === 'break' ? 'py-3' : ''}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  {/* Time + badges row */}
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-xs font-medium tabular-nums"
                                      style={{ fontFamily:'var(--font-mono)', color:'var(--color-muted)' }}>
                                      {fmtTime(item.datetime)}
                                    </span>
                                    {isCurrent ? (
                                      <span key={`now-${item.id}`} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold animate-fade-up"
                                        style={{ fontFamily:'var(--font-mono)', backgroundColor:c.bg, color:c.color, border:`1px solid ${c.border}` }}>
                                        <span className="w-1 h-1 rounded-full animate-pulse-dot inline-block" style={{ backgroundColor:c.color }} />
                                        NOW
                                      </span>
                                    ) : isNext ? (
                                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                        style={{ fontFamily:'var(--font-mono)', backgroundColor:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.35)', border:'1px solid rgba(255,255,255,0.08)' }}>
                                        Next
                                      </span>
                                    ) : (
                                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                        style={{ fontFamily:'var(--font-mono)', backgroundColor:c.bg, color:c.color, border:`1px solid ${c.border}` }}>
                                        {c.label}
                                      </span>
                                    )}
                                    {/* Real-time relative countdown */}
                                    {!isPast && (
                                      <span className="text-xs ml-auto tabular-nums"
                                        style={{ fontFamily:'var(--font-mono)', color: isCurrent ? c.color : isNext ? 'rgba(255,255,255,0.35)' : 'var(--color-muted)' }}>
                                        {isCurrent ? `started ${rel}` : rel}
                                      </span>
                                    )}
                                    {isPast && (
                                      <span className="text-xs ml-auto" style={{ fontFamily:'var(--font-mono)', color:'rgba(255,255,255,0.15)' }}>
                                        ✓ done
                                      </span>
                                    )}
                                  </div>

                                  <h3 className={`font-semibold text-white ${item.type === 'break' ? 'text-sm' : 'text-base'}`}
                                    style={{ fontFamily:'var(--font-display)' }}>
                                    {item.title}
                                  </h3>
                                  {item.description && !isPast && (
                                    <p className="text-xs mt-1 leading-relaxed" style={{ color:'#485070' }}>
                                      {item.description}
                                    </p>
                                  )}
                                </div>

                                {/* Edit pencil */}
                                <button onClick={() => setEditing(item)}
                                  className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                                  style={{ color:'var(--color-muted)' }} title="Edit">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          JOURNEY + VENUE
      ════════════════════════════════════════════════════════════════════ */}
      <section id="journey" className="py-20 px-6 border-t" style={{ borderColor:'var(--color-border)' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ fontFamily:'var(--font-mono)', color:'var(--color-teal)' }}>The Experience</p>
          <h2 className="text-4xl font-bold text-white mb-10" style={{ fontFamily:'var(--font-display)' }}>The Journey</h2>
          <div className="relative">
            <div className="absolute top-8 left-8 right-8 h-px hidden lg:block"
              style={{ background:'linear-gradient(to right, rgba(124,58,237,0.5), rgba(0,201,167,0.5))' }} />
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {JOURNEY.map(p => (
                <div key={p.label} className="flex flex-col items-center text-center group">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor:`${p.color}18`, borderColor:`${p.color}40` }}>
                    <span className="text-lg font-bold" style={{ fontFamily:'var(--font-display)', color:p.color }}>{p.num}</span>
                  </div>
                  <span className="text-sm font-semibold text-white" style={{ fontFamily:'var(--font-display)' }}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Venue info */}
          <div className="mt-16 rounded-2xl border p-8 grid sm:grid-cols-2 gap-8"
            style={{ backgroundColor:'var(--color-surface)', borderColor:'var(--color-border)' }}>
            <div>
              <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ fontFamily:'var(--font-mono)', color:'var(--color-teal)' }}>Venue</p>
              <div className="space-y-3">
                {[
                  { icon:'📍', label: config.venue },
                  { icon:'📅', label:`${fmtDateTime(config.startTime)} → ${fmtDateTime(config.endTime)}` },
                  { icon:'👥', label:'Organized by µLearn GECI' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex gap-3 text-sm">
                    <span>{icon}</span>
                    <span style={{ color:'var(--color-fg)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 rounded-xl border flex flex-col justify-center"
              style={{ backgroundColor:'rgba(124,58,237,0.07)', borderColor:'rgba(124,58,237,0.2)' }}>
              <p className="text-xs font-medium mb-2" style={{ fontFamily:'var(--font-mono)', color:'#a78bfa' }}>Theme</p>
              <p className="text-2xl font-bold text-white mb-2" style={{ fontFamily:'var(--font-display)' }}>
                "{config.tagline}"
              </p>
              <p className="text-sm" style={{ color:'var(--color-muted)' }}>Every team leaves with something built — a product, not a prototype.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8 px-6" style={{ borderColor:'var(--color-border)' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-bold tracking-widest uppercase text-sm" style={{ fontFamily:'var(--font-display)', color:'#a78bfa' }}>
            {config.eventName}
          </span>
          <p className="text-xs" style={{ fontFamily:'var(--font-mono)', color:'var(--color-muted)' }}>
            {config.venue}
          </p>
        </div>
      </footer>

      {/* ── Modals ── */}
      {showCfg && (
        <ConfigModal config={config} onSave={c => { setConfig(c); setShowCfg(false) }} onClose={() => setShowCfg(false)} />
      )}
      {editing !== null && (
        <EditModal
          item={editing === 'new' ? null : editing}
          onSave={saveItem}
          onDelete={id => { setItems(p => p.filter(x => x.id !== id)); setEditing(null) }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
