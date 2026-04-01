import { useRef, useState } from 'react'
import { signOut, uploadAvatar, getAvatarUrl, upsertProfile } from '../lib/supabaseClient'
import useAuthStore from '../store/useAuthStore'
import { LogOut, Camera, CheckCircle, AlertCircle, Loader, Pencil, X, Check } from 'lucide-react'
import { Input, MultiToggle, RangeRow } from '../components/ui/Input'

// ─── Photo helpers ────────────────────────────────────────────────────────────
const UPLOAD_IDLE = 'idle', UPLOAD_LOADING = 'loading', UPLOAD_OK = 'ok', UPLOAD_FAIL = 'fail'

function validateImage(file) {
  const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
  if (!ALLOWED.includes(file.type.toLowerCase())) return 'Please upload a JPG, PNG or WebP photo.'
  if (file.size > 8 * 1024 * 1024) return 'Photo must be under 8 MB.'
  if (file.size < 5 * 1024) return 'That file looks too small to be a real photo.'
  return null
}
function checkDimensions(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img.naturalWidth < 100 || img.naturalHeight < 100 ? 'Photo is too small — please use a clearer image.' : null) }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}

// ─── Constants ───────────────────────────────────────────────────────────────
const GENDER_OPTIONS   = [{ value: 'man', label: 'Man' }, { value: 'woman', label: 'Woman' }, { value: 'non-binary', label: 'Non-binary' }]
const SMOKING_OPTIONS  = [{ value: 'never', label: 'Never' }, { value: 'socially', label: 'Socially' }, { value: 'regularly', label: 'Regularly' }]
const DRINKING_OPTIONS = [{ value: 'never', label: 'Never' }, { value: 'socially', label: 'Socially' }, { value: 'regularly', label: 'Regularly' }]
const INTERESTS_OPTIONS = [
  { value: 'travel', label: 'Travel' }, { value: 'fitness', label: 'Fitness' },
  { value: 'cooking', label: 'Cooking' }, { value: 'music', label: 'Music' },
  { value: 'art', label: 'Art' }, { value: 'tech', label: 'Tech' },
  { value: 'gaming', label: 'Gaming' }, { value: 'reading', label: 'Reading' },
  { value: 'outdoors', label: 'Outdoors' }, { value: 'film', label: 'Film' },
  { value: 'sport', label: 'Sport' }, { value: 'yoga', label: 'Yoga' },
]

// ─── Main component ───────────────────────────────────────────────────────────
export default function Profile() {
  const profile    = useAuthStore((s) => s.profile)
  const user       = useAuthStore((s) => s.user)
  const setProfile = useAuthStore((s) => s.setProfile)

  const fileRef = useRef(null)
  const [uploadState, setUploadState] = useState(UPLOAD_IDLE)
  const [uploadMsg, setUploadMsg]     = useState('')

  // Edit mode state
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saveErr, setSaveErr]   = useState(null)
  const [editData, setEditData] = useState({})

  const attrs   = profile?.attributes ?? {}
  const filters = profile?.filters    ?? {}
  const prefs   = profile?.soft_prefs ?? {}

  // ── Open edit mode ──────────────────────────────────────────────────────────
  const openEdit = () => {
    setEditData({
      display_name:   profile?.display_name ?? '',
      age:            attrs.age ?? '',
      gender:         attrs.gender ?? '',
      location_city:  attrs.location_city ?? '',
      height_cm:      attrs.height_cm ?? '',
      has_kids:       attrs.has_kids ?? false,
      wants_kids:     attrs.wants_kids ?? false,
      smoking:        attrs.smoking ?? 'never',
      drinking:       attrs.drinking ?? 'socially',
      // Dealbreakers
      age_min:        filters.age_min ?? 22,
      age_max:        filters.age_max ?? 45,
      seeking_gender: filters.seeking_gender ?? [],
      // Soft prefs
      interests:      prefs.interests ?? [],
    })
    setSaveErr(null)
    setEditing(true)
  }

  const set = (key, val) => setEditData((d) => ({ ...d, [key]: val }))

  // ── Save edits ──────────────────────────────────────────────────────────────
  const saveEdit = async () => {
    if (!editData.display_name?.trim()) { setSaveErr('Display name is required.'); return }
    if (!editData.age || Number(editData.age) < 18) { setSaveErr('Age must be 18+.'); return }
    if (!editData.gender) { setSaveErr('Please select your gender.'); return }

    setSaving(true); setSaveErr(null)

    const attributes = {
      age:           Number(editData.age),
      gender:        editData.gender,
      location_city: editData.location_city,
      height_cm:     editData.height_cm ? Number(editData.height_cm) : null,
      has_kids:      editData.has_kids,
      wants_kids:    editData.wants_kids,
      smoking:       editData.smoking,
      drinking:      editData.drinking,
    }
    const updatedFilters = {
      ...filters,
      age_min:        Number(editData.age_min) || 18,
      age_max:        Number(editData.age_max) || 80,
      seeking_gender: editData.seeking_gender,
    }
    const soft_prefs = {
      ...prefs,
      interests: editData.interests,
    }

    const { data, error } = await upsertProfile({
      id:           user.id,
      display_name: editData.display_name.trim(),
      attributes,
      filters:      updatedFilters,
      soft_prefs,
    })

    setSaving(false)
    if (error) { setSaveErr(error.message); return }
    if (data) setProfile(data)
    setEditing(false)
  }

  // ── Photo upload ────────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = ''
    const basicErr = validateImage(file)
    if (basicErr) { setUploadState(UPLOAD_FAIL); setUploadMsg(basicErr); return }
    setUploadState(UPLOAD_LOADING); setUploadMsg('Checking image…')
    const dimErr = await checkDimensions(file)
    if (dimErr) { setUploadState(UPLOAD_FAIL); setUploadMsg(dimErr); return }
    setUploadMsg('Uploading…')
    const { error: uploadError, path } = await uploadAvatar(user.id, file)
    if (uploadError) { setUploadState(UPLOAD_FAIL); setUploadMsg(uploadError.message); return }
    const publicUrl = getAvatarUrl(path)
    const { data: updatedProfile } = await upsertProfile({ id: user.id, avatar_url: publicUrl })
    if (updatedProfile) setProfile(updatedProfile)
    else setProfile({ ...profile, avatar_url: publicUrl })
    setUploadState(UPLOAD_OK); setUploadMsg('Photo saved!')
    setTimeout(() => setUploadState(UPLOAD_IDLE), 3000)
  }

  const avatarUrl = profile?.avatar_url
  const initial   = profile?.display_name?.[0]?.toUpperCase() ?? '?'

  // ── Edit mode UI ──────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="flex flex-col flex-1 px-4 pt-4 pb-10" style={{ background: '#FEF6F0' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-xl" style={{ color: '#1C1018' }}>Edit Profile</h1>
          <button onClick={() => setEditing(false)} className="p-2 rounded-xl transition-colors"
            style={{ color: '#9B8890', background: '#FFFFFF', border: '1.5px solid #F0E4DC' }}>
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5 flex-1">
          <Input label="Display Name *" value={editData.display_name}
            onChange={(e) => set('display_name', e.target.value)} maxLength={32} />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Age *" type="number" min={18} max={99} value={editData.age}
              onChange={(e) => set('age', e.target.value)} />
            <Input label="Height (cm)" type="number" min={140} max={220} value={editData.height_cm}
              onChange={(e) => set('height_cm', e.target.value)} />
          </div>

          <Input label="City" placeholder="London" value={editData.location_city}
            onChange={(e) => set('location_city', e.target.value)} />

          <MultiToggle label="I am a *" options={GENDER_OPTIONS}
            value={editData.gender ? [editData.gender] : []}
            onChange={(vals) => set('gender', vals[vals.length - 1] ?? '')} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="section-label" style={{ color: '#C4ADB5' }}>Have kids?</p>
              <MultiToggle options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
                value={[String(editData.has_kids)]}
                onChange={(vals) => set('has_kids', vals[vals.length - 1] === 'true')} />
            </div>
            <div>
              <p className="section-label" style={{ color: '#C4ADB5' }}>Want kids?</p>
              <MultiToggle options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
                value={[String(editData.wants_kids)]}
                onChange={(vals) => set('wants_kids', vals[vals.length - 1] === 'true')} />
            </div>
          </div>

          <MultiToggle label="Smoking" options={SMOKING_OPTIONS}
            value={editData.smoking ? [editData.smoking] : []}
            onChange={(vals) => set('smoking', vals[vals.length - 1] ?? '')} />

          <MultiToggle label="Drinking" options={DRINKING_OPTIONS}
            value={editData.drinking ? [editData.drinking] : []}
            onChange={(vals) => set('drinking', vals[vals.length - 1] ?? '')} />

          {/* Dealbreakers section */}
          <div className="pt-2">
            <p className="section-label mb-3" style={{ color: 'rgba(232,51,106,0.6)' }}>Dealbreakers</p>
            <div className="space-y-4">
              <RangeRow label="Age range" minName="age_min" maxName="age_max"
                minVal={editData.age_min} maxVal={editData.age_max}
                onMinChange={(e) => set('age_min', e.target.value)}
                onMaxChange={(e) => set('age_max', e.target.value)}
                min={18} max={80} />
              <MultiToggle label="Seeking" options={GENDER_OPTIONS}
                value={editData.seeking_gender ?? []}
                onChange={(vals) => set('seeking_gender', vals)} />
            </div>
          </div>

          {/* Interests */}
          <div className="pt-2">
            <p className="section-label mb-3" style={{ color: '#C4ADB5' }}>Interests</p>
            <MultiToggle options={INTERESTS_OPTIONS}
              value={editData.interests ?? []}
              onChange={(vals) => set('interests', vals.slice(0, 6))} />
          </div>

          {saveErr && (
            <div className="px-3 py-2.5 rounded-xl flex items-center gap-2"
              style={{ background: 'rgba(232,51,106,0.08)', border: '1px solid rgba(232,51,106,0.25)' }}>
              <AlertCircle size={14} style={{ color: '#E8336A', flexShrink: 0 }} />
              <span className="text-xs" style={{ color: '#E8336A' }}>{saveErr}</span>
            </div>
          )}

          <button onClick={saveEdit} disabled={saving}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-heading text-sm tracking-widest uppercase transition-all duration-150 active:scale-[0.97] disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #E8336A, #FF6B6B)', color: 'white', boxShadow: '0 8px 20px rgba(232,51,106,0.25)' }}>
            {saving ? <><Loader size={15} className="animate-spin" /> Saving…</> : <><Check size={15} /> Save Changes</>}
          </button>

          <div className="pb-4" />
        </div>
      </div>
    )
  }

  // ── View mode UI ──────────────────────────────────────────────────────────
  const statRows = [
    { label: 'Age',        value: attrs.age },
    { label: 'Gender',     value: attrs.gender },
    { label: 'City',       value: attrs.location_city },
    { label: 'Height',     value: attrs.height_cm ? `${attrs.height_cm} cm` : null },
    { label: 'Kids',       value: attrs.has_kids === true ? 'Has kids' : attrs.has_kids === false ? 'No kids' : null },
    { label: 'Wants kids', value: attrs.wants_kids === true ? 'Yes' : attrs.wants_kids === false ? 'No' : null },
    { label: 'Smoking',    value: attrs.smoking },
    { label: 'Drinking',   value: attrs.drinking },
  ].filter((r) => r.value != null)

  return (
    <div className="flex flex-col flex-1 px-4 pt-4 pb-10" style={{ background: '#FEF6F0' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-xl" style={{ color: '#1C1018' }}>Profile</h1>
        <button onClick={openEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all duration-150 active:scale-[0.97]"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E4DC', color: '#9B8890' }}>
          <Pencil size={13} /> Edit
        </button>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-7">
        <div className="relative flex-none">
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FFF0F5, #FEF6F0)', border: '1.5px solid #F0E4DC' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : <span className="font-heading text-xl" style={{ color: '#D4A8B5' }}>{initial}</span>}
          </div>
          <button onClick={() => fileRef.current?.click()} disabled={uploadState === UPLOAD_LOADING}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: '#E8336A', border: '2px solid #FEF6F0', boxShadow: '0 2px 8px rgba(232,51,106,0.4)' }}>
            {uploadState === UPLOAD_LOADING
              ? <Loader size={11} className="text-white animate-spin" />
              : <Camera size={11} className="text-white" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-lg truncate" style={{ color: '#1C1018' }}>{profile?.display_name ?? '—'}</p>
          <p className="text-xs truncate" style={{ color: '#C4ADB5' }}>{user?.email}</p>
        </div>
      </div>

      {/* Upload status */}
      {uploadState !== UPLOAD_IDLE && (
        <div className="mb-4 px-3 py-2.5 rounded-xl flex items-center gap-2 animate-fade-in"
          style={uploadState === UPLOAD_OK
            ? { background: 'rgba(0,179,122,0.08)',   border: '1px solid rgba(0,179,122,0.25)' }
            : uploadState === UPLOAD_FAIL
            ? { background: 'rgba(232,51,106,0.08)',  border: '1px solid rgba(232,51,106,0.25)' }
            : { background: '#FFFFFF', border: '1.5px solid #F0E4DC' }}>
          {uploadState === UPLOAD_OK      && <CheckCircle size={14} style={{ color: '#00B37A', flexShrink: 0 }} />}
          {uploadState === UPLOAD_FAIL    && <AlertCircle size={14} style={{ color: '#E8336A', flexShrink: 0 }} />}
          {uploadState === UPLOAD_LOADING && <Loader size={14} className="animate-spin" style={{ color: '#9B8890', flexShrink: 0 }} />}
          <span className="text-xs"
            style={{ color: uploadState === UPLOAD_OK ? '#00B37A' : uploadState === UPLOAD_FAIL ? '#E8336A' : '#9B8890' }}>
            {uploadMsg}
          </span>
        </div>
      )}

      {!avatarUrl && uploadState === UPLOAD_IDLE && (
        <div className="mb-4 px-3 py-2.5 rounded-xl"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E4DC' }}>
          <p className="text-xs" style={{ color: '#C4ADB5' }}>
            Tap the camera icon to add a profile photo.
          </p>
        </div>
      )}

      {/* Stats */}
      {statRows.length > 0 && (
        <div className="card mb-4" style={{ background: '#FFFFFF', border: '1.5px solid #F0E4DC' }}>
          <p className="section-label" style={{ color: '#C4ADB5' }}>My Stats</p>
          <div className="space-y-2.5 mt-2">
            {statRows.map((r) => (
              <div key={r.label} className="flex justify-between text-sm">
                <span style={{ color: '#9B8890' }}>{r.label}</span>
                <span className="capitalize" style={{ color: '#1C1018' }}>{String(r.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dealbreakers */}
      {filters.seeking_gender?.length > 0 && (
        <div className="card mb-4" style={{ background: '#FFFFFF', border: '1.5px solid #F0E4DC' }}>
          <p className="section-label" style={{ color: '#C4ADB5' }}>Dealbreakers</p>
          <div className="space-y-2.5 mt-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: '#9B8890' }}>Age range</span>
              <span className="font-mono" style={{ color: '#1C1018' }}>{filters.age_min}–{filters.age_max}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#9B8890' }}>Seeking</span>
              <span className="capitalize" style={{ color: '#1C1018' }}>{filters.seeking_gender?.join(', ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Interests */}
      {prefs.interests?.length > 0 && (
        <div className="card mb-6" style={{ background: '#FFFFFF', border: '1.5px solid #F0E4DC' }}>
          <p className="section-label" style={{ color: '#C4ADB5' }}>Interests</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {prefs.interests.map((i) => <span key={i} className="tag capitalize">{i}</span>)}
          </div>
        </div>
      )}

      <div className="mt-auto pt-2">
        <button onClick={signOut}
          className="w-full py-3.5 px-5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98]"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E4DC', color: '#9B8890' }}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  )
}
