import { useState, useRef } from 'react'
import { ArrowRight, ArrowLeft, Check, User, Shield, Heart, Camera, Loader, CheckCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { Input, Select, MultiToggle, RangeRow } from './ui/Input'
import { upsertProfile, uploadAvatar, getAvatarUrl } from '../lib/supabaseClient'
import { getAvatarGradient } from '../lib/avatarUtils'
import useAuthStore from '../store/useAuthStore'

// ─── Constants ───────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: 'man', label: 'Man' },
  { value: 'woman', label: 'Woman' },
  { value: 'non-binary', label: 'Non-binary' },
]
const SMOKING_OPTIONS  = [{ value: 'never', label: 'Never' }, { value: 'socially', label: 'Socially' }, { value: 'regularly', label: 'Regularly' }]
const DRINKING_OPTIONS = [{ value: 'never', label: 'Never' }, { value: 'socially', label: 'Socially' }, { value: 'regularly', label: 'Regularly' }]
const EDUCATION_OPTIONS = [
  { value: 'high_school', label: 'High School' }, { value: 'some_college', label: 'Some College' },
  { value: 'university', label: 'University' }, { value: 'postgraduate', label: 'Postgraduate' },
  { value: 'trade', label: 'Trade / Vocational' },
]
const RELIGION_OPTIONS = [
  { value: 'none', label: 'None' }, { value: 'christian', label: 'Christian' },
  { value: 'muslim', label: 'Muslim' }, { value: 'jewish', label: 'Jewish' },
  { value: 'hindu', label: 'Hindu' }, { value: 'buddhist', label: 'Buddhist' },
  { value: 'other', label: 'Other' },
]
const INTERESTS_OPTIONS = [
  { value: 'travel', label: 'Travel' }, { value: 'fitness', label: 'Fitness' },
  { value: 'cooking', label: 'Cooking' }, { value: 'music', label: 'Music' },
  { value: 'art', label: 'Art' }, { value: 'tech', label: 'Tech' },
  { value: 'gaming', label: 'Gaming' }, { value: 'reading', label: 'Reading' },
  { value: 'outdoors', label: 'Outdoors' }, { value: 'film', label: 'Film' },
  { value: 'sport', label: 'Sport' }, { value: 'yoga', label: 'Yoga' },
]

// Steps: 1=Profile, 2=Photo, 3=Dealbreakers, 4=Preferences
const STEPS = [
  { id: 1, label: 'Profile',      icon: User,   headline: 'Who are you?' },
  { id: 2, label: 'Photo',        icon: Camera, headline: 'Add your photo.' },
  { id: 3, label: 'Dealbreakers', icon: Shield, headline: 'Your hard limits.' },
  { id: 4, label: 'Preferences',  icon: Heart,  headline: 'What draws you in?' },
]

// ─── Photo step ───────────────────────────────────────────────────────────────

function StepPhoto({ displayName, userId, avatarUrl, onUploaded }) {
  const fileRef  = useRef(null)
  const [status, setStatus] = useState(avatarUrl ? 'done' : 'idle')  // idle | uploading | done | error
  const [errMsg, setErrMsg] = useState('')
  const [preview, setPreview] = useState(avatarUrl ?? null)

  const gradient = getAvatarGradient(displayName)
  const initial  = displayName?.[0]?.toUpperCase() ?? '?'

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = ''

    if (!file.type.startsWith('image/')) { setErrMsg('Please choose an image file.'); setStatus('error'); return }
    if (file.size > 8 * 1024 * 1024) { setErrMsg('Photo must be under 8 MB.'); setStatus('error'); return }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setStatus('uploading')

    const { error: uploadErr, path } = await uploadAvatar(userId, file)
    if (uploadErr) { setErrMsg(uploadErr.message); setStatus('error'); setPreview(null); return }

    const publicUrl = getAvatarUrl(path)
    setPreview(publicUrl)
    setStatus('done')
    onUploaded(publicUrl)
  }

  return (
    <div className="space-y-6 animate-slide-up">

      {/* Big photo picker */}
      <div className="flex flex-col items-center">
        <div className="relative mb-4">
          {/* Avatar circle */}
          <div
            className="w-36 h-36 rounded-3xl overflow-hidden flex items-center justify-center"
            style={preview
              ? { border: '3px solid #E8336A', boxShadow: '0 8px 32px rgba(232,51,106,0.25)' }
              : { border: '2px dashed #F0E4DC', boxShadow: 'none' }}
          >
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: gradient }}>
                <span className="font-heading text-5xl text-white" style={{ opacity: 0.4 }}>{initial}</span>
              </div>
            )}
          </div>

          {/* Camera button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={status === 'uploading'}
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90"
            style={{
              background: status === 'done' ? '#00B37A' : 'linear-gradient(135deg, #E8336A, #FF6B6B)',
              boxShadow: status === 'done' ? '0 4px 14px rgba(0,179,122,0.4)' : '0 4px 14px rgba(232,51,106,0.4)',
              color: 'white',
            }}
          >
            {status === 'uploading' ? <Loader size={16} className="animate-spin" />
             : status === 'done'    ? <CheckCircle size={16} />
             :                        <Camera size={16} />}
          </button>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        {/* Status text */}
        {status === 'idle' && (
          <p className="text-sm font-medium" style={{ color: '#9B8890' }}>Tap the camera to add your photo</p>
        )}
        {status === 'uploading' && (
          <p className="text-sm font-medium" style={{ color: '#9B8890' }}>Uploading…</p>
        )}
        {status === 'done' && (
          <p className="text-sm font-medium" style={{ color: '#00B37A' }}>Looking good! ✓</p>
        )}
        {status === 'error' && (
          <p className="text-sm" style={{ color: '#E8336A' }}>{errMsg}</p>
        )}
      </div>

      {/* Info card */}
      <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1.5px solid #F0E4DC' }}>
        <p className="text-xs font-medium mb-2" style={{ color: '#1C1018' }}>Why add a photo?</p>
        <ul className="space-y-1.5 text-xs" style={{ color: '#9B8890' }}>
          <li>• Profiles with photos get significantly more matches</li>
          <li>• Your photo helps Fussy's reciprocal matching feel real</li>
          <li>• You can always update it from your Profile later</li>
        </ul>
      </div>

      <button
        onClick={() => fileRef.current?.click()}
        disabled={status === 'uploading'}
        className="w-full py-3.5 rounded-2xl text-sm font-medium transition-all active:scale-[0.97]"
        style={{
          background: status === 'done' ? 'rgba(0,179,122,0.08)' : '#FFFFFF',
          border: `1.5px solid ${status === 'done' ? 'rgba(0,179,122,0.3)' : '#F0E4DC'}`,
          color: status === 'done' ? '#00B37A' : '#9B8890',
        }}
      >
        {status === 'done' ? '✓ Photo added — tap to change' : 'Choose a photo from your device'}
      </button>

      <p className="text-center text-xs" style={{ color: '#C4ADB5' }}>
        This step is optional — you can skip and add a photo later.
      </p>
    </div>
  )
}

// ─── Step 1: Profile stats ────────────────────────────────────────────────────

function StepProfileStats({ data, onChange, errors = {} }) {
  return (
    <div className="space-y-5 animate-slide-up">
      <Input label="Display Name *" placeholder="How should people know you?"
        value={data.display_name} onChange={(e) => onChange('display_name', e.target.value)}
        maxLength={32} error={errors.display_name} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Age *" type="number" placeholder="25" min={18} max={99}
          value={data.age} onChange={(e) => onChange('age', e.target.value)} error={errors.age} />
        <Input label="Height (cm)" type="number" placeholder="170" min={140} max={220}
          value={data.height_cm} onChange={(e) => onChange('height_cm', e.target.value)} />
      </div>
      <div>
        <MultiToggle label="I am a *" options={GENDER_OPTIONS}
          value={data.gender ? [data.gender] : []}
          onChange={(vals) => onChange('gender', vals[vals.length - 1] ?? '')} />
        {errors.gender && <p className="mt-1.5 text-xs" style={{ color: '#E8336A' }}>{errors.gender}</p>}
      </div>
      <Input label="City *" placeholder="London" value={data.location_city}
        onChange={(e) => onChange('location_city', e.target.value)} error={errors.location_city} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="section-label" style={{ color: '#C4ADB5' }}>Have kids?</p>
          <MultiToggle options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
            value={[String(data.has_kids)]}
            onChange={(vals) => onChange('has_kids', vals[vals.length - 1] === 'true')} />
        </div>
        <div>
          <p className="section-label" style={{ color: '#C4ADB5' }}>Want kids?</p>
          <MultiToggle options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
            value={[String(data.wants_kids)]}
            onChange={(vals) => onChange('wants_kids', vals[vals.length - 1] === 'true')} />
        </div>
      </div>
      <MultiToggle label="Smoking" options={SMOKING_OPTIONS}
        value={data.smoking ? [data.smoking] : []}
        onChange={(vals) => onChange('smoking', vals[vals.length - 1] ?? '')} />
      <MultiToggle label="Drinking" options={DRINKING_OPTIONS}
        value={data.drinking ? [data.drinking] : []}
        onChange={(vals) => onChange('drinking', vals[vals.length - 1] ?? '')} />
    </div>
  )
}

// ─── Step 3: Dealbreakers ─────────────────────────────────────────────────────

function StepDealbreakers({ data, onChange, errors = {} }) {
  return (
    <div className="space-y-5 animate-slide-up">
      <div className="card mb-1"
        style={{ background: 'rgba(232,51,106,0.05)', border: '1px solid rgba(232,51,106,0.2)' }}>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(232,51,106,0.8)' }}>
          These are your hard filters. You'll only see people who meet these criteria, and who you also meet theirs.
        </p>
      </div>
      <RangeRow label="Age range" minName="age_min" maxName="age_max"
        minVal={data.age_min} maxVal={data.age_max}
        onMinChange={(e) => onChange('age_min', e.target.value)}
        onMaxChange={(e) => onChange('age_max', e.target.value)}
        min={18} max={80} />
      <div>
        <MultiToggle label="Seeking" options={GENDER_OPTIONS}
          value={data.seeking_gender ?? []}
          onChange={(vals) => onChange('seeking_gender', vals)} />
        {errors.seeking_gender && (
          <p className="mt-1.5 text-xs" style={{ color: '#E8336A' }}>{errors.seeking_gender}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="section-label" style={{ color: '#C4ADB5' }}>Has kids?</p>
          <Select value={data.filter_has_kids} onChange={(e) => onChange('filter_has_kids', e.target.value)}>
            <option value="">No preference</option>
            <option value="true">Must have</option>
            <option value="false">Must not have</option>
          </Select>
        </div>
        <div>
          <p className="section-label" style={{ color: '#C4ADB5' }}>Wants kids?</p>
          <Select value={data.filter_wants_kids} onChange={(e) => onChange('filter_wants_kids', e.target.value)}>
            <option value="">No preference</option>
            <option value="true">Wants kids</option>
            <option value="false">Does not</option>
          </Select>
        </div>
      </div>
      <MultiToggle label="Smoking (acceptable)" options={SMOKING_OPTIONS}
        value={data.filter_smoking ?? []}
        onChange={(vals) => onChange('filter_smoking', vals)} />
      <MultiToggle label="Drinking (acceptable)" options={DRINKING_OPTIONS}
        value={data.filter_drinking ?? []}
        onChange={(vals) => onChange('filter_drinking', vals)} />
    </div>
  )
}

// ─── Step 4: Soft preferences ─────────────────────────────────────────────────

function StepSoftPreferences({ data, onChange }) {
  return (
    <div className="space-y-5 animate-slide-up">
      <div className="card mb-1"
        style={{ background: 'rgba(0,179,122,0.05)', border: '1px solid rgba(0,179,122,0.2)' }}>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(0,179,122,0.8)' }}>
          These shape your Fussy Score — the compatibility % shown after you match.
        </p>
      </div>
      <MultiToggle label="Education" options={EDUCATION_OPTIONS}
        value={data.education ? [data.education] : []}
        onChange={(vals) => onChange('education', vals[vals.length - 1] ?? '')} />
      <MultiToggle label="Religion" options={RELIGION_OPTIONS}
        value={data.religion ? [data.religion] : []}
        onChange={(vals) => onChange('religion', vals[vals.length - 1] ?? '')} />
      <MultiToggle label="Interests (pick up to 6)" options={INTERESTS_OPTIONS}
        value={data.interests ?? []}
        onChange={(vals) => onChange('interests', vals.slice(0, 6))} />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FussyOnboarding({ onComplete }) {
  const user       = useAuthStore((s) => s.user)
  const setProfile = useAuthStore((s) => s.setProfile)

  const [step, setStep]         = useState(1)
  const [saving, setSaving]     = useState(false)
  const [errors, setErrors]     = useState({})
  const [saveError, setSaveError] = useState(null)
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState(null)

  const [profileData, setProfileData] = useState({
    display_name: '', age: '', gender: '', location_city: '',
    height_cm: '', has_kids: false, wants_kids: false,
    smoking: 'never', drinking: 'socially',
  })

  const [dealbreakers, setDealbreakers] = useState({
    age_min: '22', age_max: '40', seeking_gender: [],
    filter_has_kids: '', filter_wants_kids: '',
    filter_smoking: ['never', 'socially'], filter_drinking: ['never', 'socially'],
  })

  const [softPrefs, setSoftPrefs] = useState({ education: '', religion: '', interests: [] })

  const handleProfileChange = (key, val) => {
    setProfileData((p) => ({ ...p, [key]: val }))
    setErrors((e) => ({ ...e, [key]: null }))
  }

  const validateStep1 = () => {
    const errs = {}
    if (!profileData.display_name.trim()) errs.display_name = 'Required'
    if (!profileData.age || Number(profileData.age) < 18) errs.age = 'Must be 18+'
    if (!profileData.gender) errs.gender = 'Select one'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep3 = () => {
    const errs = {}
    if (!dealbreakers.seeking_gender.length) errs.seeking_gender = 'Select at least one'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 3 && !validateStep3()) return
    setStep((s) => s + 1)
  }

  const save = async () => {
    setSaving(true)

    const attributes = {
      age: Number(profileData.age), gender: profileData.gender,
      location_city: profileData.location_city,
      height_cm: profileData.height_cm ? Number(profileData.height_cm) : null,
      has_kids: profileData.has_kids, wants_kids: profileData.wants_kids,
      smoking: profileData.smoking, drinking: profileData.drinking,
    }
    const filters = {
      age_min: Number(dealbreakers.age_min) || 18,
      age_max: Number(dealbreakers.age_max) || 80,
      seeking_gender: dealbreakers.seeking_gender,
      ...(dealbreakers.filter_has_kids !== '' && { has_kids: dealbreakers.filter_has_kids === 'true' }),
      ...(dealbreakers.filter_wants_kids !== '' && { wants_kids: dealbreakers.filter_wants_kids === 'true' }),
      ...(dealbreakers.filter_smoking.length && { smoking: dealbreakers.filter_smoking }),
      ...(dealbreakers.filter_drinking.length && { drinking: dealbreakers.filter_drinking }),
    }
    const soft_prefs = {
      ...(softPrefs.education && { education: softPrefs.education }),
      ...(softPrefs.religion  && { religion:  softPrefs.religion }),
      ...(softPrefs.interests.length && { interests: softPrefs.interests }),
    }

    const { data, error } = await upsertProfile({
      id:           user.id,
      display_name: profileData.display_name.trim(),
      attributes, filters, soft_prefs,
      onboarding_complete: true,
      ...(uploadedAvatarUrl && { avatar_url: uploadedAvatarUrl }),
    })

    setSaving(false)
    if (error) { setSaveError(error.message); return }
    if (data) setProfile(data)
    onComplete()
  }

  const currentStep = STEPS[step - 1]
  const isPhotoStep = step === 2

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#FEF6F0' }}>

      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <p className="font-heading text-xs tracking-widest uppercase mb-4" style={{ color: '#E8336A' }}>FUSSY</p>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((s) => (
            <div key={s.id} className="h-1 flex-1 rounded-full transition-all duration-500"
              style={{ background: s.id <= step ? '#E8336A' : '#F0E4DC' }} />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: step > currentStep.id ? 'rgba(0,179,122,0.12)' : 'rgba(232,51,106,0.12)' }}>
            <currentStep.icon size={16} style={{ color: step > currentStep.id ? '#00B37A' : '#E8336A' }} />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: '#9B8890' }}>
              Step {step} of {STEPS.length} — {currentStep.label}
            </p>
            <h1 className="font-heading text-xl mt-0.5" style={{ color: '#1C1018' }}>{currentStep.headline}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {step === 1 && (
          <>
            {Object.keys(errors).length > 0 && (
              <div className="mb-4 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(232,51,106,0.08)', border: '1px solid rgba(232,51,106,0.25)' }}>
                <p className="text-xs" style={{ color: '#E8336A' }}>Please fill in the required fields marked with *</p>
              </div>
            )}
            <StepProfileStats data={profileData} onChange={handleProfileChange} errors={errors} />
          </>
        )}
        {step === 2 && (
          <StepPhoto
            displayName={profileData.display_name || 'You'}
            userId={user.id}
            avatarUrl={uploadedAvatarUrl}
            onUploaded={setUploadedAvatarUrl}
          />
        )}
        {step === 3 && (
          <StepDealbreakers data={dealbreakers} onChange={(k, v) => setDealbreakers((d) => ({ ...d, [k]: v }))} errors={errors} />
        )}
        {step === 4 && (
          <StepSoftPreferences data={softPrefs} onChange={(k, v) => setSoftPrefs((s) => ({ ...s, [k]: v }))} />
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-8 pt-3 flex flex-col gap-3" style={{ borderTop: '1.5px solid #F0E4DC' }}>
        {saveError && (
          <p className="text-xs px-3 py-2 rounded-xl" style={{ color: '#E8336A', background: 'rgba(232,51,106,0.08)' }}>{saveError}</p>
        )}
        <div className="flex gap-3">
          {step > 1 && (
            <Button variant="ghost" onClick={() => { setStep((s) => s - 1); setSaveError(null) }} className="flex-none w-auto px-4">
              <ArrowLeft size={16} />
            </Button>
          )}
          {step < STEPS.length ? (
            <Button onClick={next} className="flex-1">
              {isPhotoStep ? (uploadedAvatarUrl ? 'Next' : 'Skip for now') : 'Continue'} <ArrowRight size={16} />
            </Button>
          ) : (
            <Button variant="success" onClick={save} disabled={saving} className="flex-1">
              {saving ? 'Saving…' : <><Check size={16} /> Finish — Let&apos;s go</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
