import { useState } from 'react'
import { ArrowRight, ArrowLeft, Check, User, Shield, Heart } from 'lucide-react'
import { Button } from './ui/Button'
import { Input, Select, MultiToggle, RangeRow } from './ui/Input'
import { upsertProfile } from '../lib/supabaseClient'
import useAuthStore from '../store/useAuthStore'

// ─── Constants ───────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: 'man', label: 'Man' },
  { value: 'woman', label: 'Woman' },
  { value: 'non-binary', label: 'Non-binary' },
]

const SMOKING_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'socially', label: 'Socially' },
  { value: 'regularly', label: 'Regularly' },
]

const DRINKING_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'socially', label: 'Socially' },
  { value: 'regularly', label: 'Regularly' },
]

const EDUCATION_OPTIONS = [
  { value: 'high_school', label: 'High School' },
  { value: 'some_college', label: 'Some College' },
  { value: 'university', label: 'University' },
  { value: 'postgraduate', label: 'Postgraduate' },
  { value: 'trade', label: 'Trade / Vocational' },
]

const RELIGION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'christian', label: 'Christian' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'jewish', label: 'Jewish' },
  { value: 'hindu', label: 'Hindu' },
  { value: 'buddhist', label: 'Buddhist' },
  { value: 'other', label: 'Other' },
]

const INTERESTS_OPTIONS = [
  { value: 'travel', label: 'Travel' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'music', label: 'Music' },
  { value: 'art', label: 'Art' },
  { value: 'tech', label: 'Tech' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'reading', label: 'Reading' },
  { value: 'outdoors', label: 'Outdoors' },
  { value: 'film', label: 'Film' },
  { value: 'sport', label: 'Sport' },
  { value: 'yoga', label: 'Yoga' },
]

const STEPS = [
  { id: 1, label: 'Profile', icon: User, headline: 'Who are you?' },
  { id: 2, label: 'Dealbreakers', icon: Shield, headline: 'Your hard limits.' },
  { id: 3, label: 'Preferences', icon: Heart, headline: 'What draws you in?' },
]

// ─── Step components ─────────────────────────────────────────────────────────

function StepProfileStats({ data, onChange, errors = {} }) {
  return (
    <div className="space-y-5 animate-slide-up">
      <Input
        label="Display Name *"
        placeholder="How should people know you?"
        value={data.display_name}
        onChange={(e) => onChange('display_name', e.target.value)}
        maxLength={32}
        error={errors.display_name}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Age *"
          type="number"
          placeholder="25"
          min={18}
          max={99}
          value={data.age}
          onChange={(e) => onChange('age', e.target.value)}
          error={errors.age}
        />
        <Input
          label="Height (cm)"
          type="number"
          placeholder="170"
          min={140}
          max={220}
          value={data.height_cm}
          onChange={(e) => onChange('height_cm', e.target.value)}
        />
      </div>
      <div>
        <MultiToggle
          label="I am a *"
          options={GENDER_OPTIONS}
          value={data.gender ? [data.gender] : []}
          onChange={(vals) => onChange('gender', vals[vals.length - 1] ?? '')}
        />
        {errors.gender && <p className="mt-1.5 text-xs text-urgency">{errors.gender}</p>}
      </div>
      <Input
        label="City *"
        placeholder="London"
        value={data.location_city}
        onChange={(e) => onChange('location_city', e.target.value)}
        error={errors.location_city}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="section-label">Have kids?</p>
          <MultiToggle
            options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
            value={[String(data.has_kids)]}
            onChange={(vals) => onChange('has_kids', vals[vals.length - 1] === 'true')}
          />
        </div>
        <div>
          <p className="section-label">Want kids?</p>
          <MultiToggle
            options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
            value={[String(data.wants_kids)]}
            onChange={(vals) => onChange('wants_kids', vals[vals.length - 1] === 'true')}
          />
        </div>
      </div>
      <MultiToggle
        label="Smoking"
        options={SMOKING_OPTIONS}
        value={data.smoking ? [data.smoking] : []}
        onChange={(vals) => onChange('smoking', vals[vals.length - 1] ?? '')}
      />
      <MultiToggle
        label="Drinking"
        options={DRINKING_OPTIONS}
        value={data.drinking ? [data.drinking] : []}
        onChange={(vals) => onChange('drinking', vals[vals.length - 1] ?? '')}
      />
    </div>
  )
}

function StepDealbreakers({ data, onChange, errors = {} }) {
  return (
    <div className="space-y-5 animate-slide-up">
      <div className="card border-urgency/20 bg-urgency/5 mb-1">
        <p className="text-xs text-urgency/80 leading-relaxed">
          These are your hard filters. You'll only see people who meet these criteria, and who you also meet theirs.
        </p>
      </div>
      <RangeRow
        label="Age range"
        minName="age_min"
        maxName="age_max"
        minVal={data.age_min}
        maxVal={data.age_max}
        onMinChange={(e) => onChange('age_min', e.target.value)}
        onMaxChange={(e) => onChange('age_max', e.target.value)}
        min={18}
        max={80}
      />
      <div>
        <MultiToggle
          label="Seeking"
          options={GENDER_OPTIONS}
          value={data.seeking_gender ?? []}
          onChange={(vals) => onChange('seeking_gender', vals)}
        />
        {errors.seeking_gender && (
          <p className="mt-1.5 text-xs text-urgency">{errors.seeking_gender}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="section-label">Has kids?</p>
          <Select
            value={data.filter_has_kids}
            onChange={(e) => onChange('filter_has_kids', e.target.value)}
          >
            <option value="">No preference</option>
            <option value="true">Must have</option>
            <option value="false">Must not have</option>
          </Select>
        </div>
        <div>
          <p className="section-label">Wants kids?</p>
          <Select
            value={data.filter_wants_kids}
            onChange={(e) => onChange('filter_wants_kids', e.target.value)}
          >
            <option value="">No preference</option>
            <option value="true">Wants kids</option>
            <option value="false">Does not</option>
          </Select>
        </div>
      </div>
      <MultiToggle
        label="Smoking (acceptable)"
        options={[{ value: 'never', label: 'Never' }, { value: 'socially', label: 'Socially' }, { value: 'regularly', label: 'Regularly' }]}
        value={data.filter_smoking ?? []}
        onChange={(vals) => onChange('filter_smoking', vals)}
      />
      <MultiToggle
        label="Drinking (acceptable)"
        options={[{ value: 'never', label: 'Never' }, { value: 'socially', label: 'Socially' }, { value: 'regularly', label: 'Regularly' }]}
        value={data.filter_drinking ?? []}
        onChange={(vals) => onChange('filter_drinking', vals)}
      />
    </div>
  )
}

function StepSoftPreferences({ data, onChange }) {
  return (
    <div className="space-y-5 animate-slide-up">
      <div className="card border-success/20 bg-success/5 mb-1">
        <p className="text-xs text-success/80 leading-relaxed">
          These shape your Fussy Score — the compatibility % shown after you match.
        </p>
      </div>
      <MultiToggle
        label="Education"
        options={EDUCATION_OPTIONS}
        value={data.education ? [data.education] : []}
        onChange={(vals) => onChange('education', vals[vals.length - 1] ?? '')}
      />
      <MultiToggle
        label="Religion"
        options={RELIGION_OPTIONS}
        value={data.religion ? [data.religion] : []}
        onChange={(vals) => onChange('religion', vals[vals.length - 1] ?? '')}
      />
      <MultiToggle
        label="Interests (pick up to 6)"
        options={INTERESTS_OPTIONS}
        value={data.interests ?? []}
        onChange={(vals) => onChange('interests', vals.slice(0, 6))}
      />
    </div>
  )
}

// ─── Main onboarding component ────────────────────────────────────────────────

export default function FussyOnboarding({ onComplete }) {
  const user = useAuthStore((s) => s.user)
  const setProfile = useAuthStore((s) => s.setProfile)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState(null)

  const [profileData, setProfileData] = useState({
    display_name: '',
    age: '',
    gender: '',
    location_city: '',
    height_cm: '',
    has_kids: false,
    wants_kids: false,
    smoking: 'never',
    drinking: 'socially',
  })

  const [dealbreakers, setDealbreakers] = useState({
    age_min: '22',
    age_max: '40',
    seeking_gender: [],
    filter_has_kids: '',
    filter_wants_kids: '',
    filter_smoking: ['never', 'socially'],
    filter_drinking: ['never', 'socially'],
  })

  const [softPrefs, setSoftPrefs] = useState({
    education: '',
    religion: '',
    interests: [],
  })

  const handleProfileChange = (key, value) => {
    setProfileData((p) => ({ ...p, [key]: value }))
    setErrors((e) => ({ ...e, [key]: null }))
  }

  const handleDealbreakerChange = (key, value) => {
    setDealbreakers((d) => ({ ...d, [key]: value }))
  }

  const handleSoftPrefChange = (key, value) => {
    setSoftPrefs((s) => ({ ...s, [key]: value }))
  }

  const validateStep1 = () => {
    const errs = {}
    if (!profileData.display_name.trim()) errs.display_name = 'Required'
    if (!profileData.age || Number(profileData.age) < 18) errs.age = 'Must be 18+'
    if (!profileData.gender) errs.gender = 'Select one'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep2 = () => {
    const errs = {}
    if (!dealbreakers.seeking_gender.length) errs.seeking_gender = 'Select at least one'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep((s) => s + 1)
  }

  const save = async () => {
    setSaving(true)

    // Build attributes JSONB
    const attributes = {
      age: Number(profileData.age),
      gender: profileData.gender,
      location_city: profileData.location_city,
      height_cm: profileData.height_cm ? Number(profileData.height_cm) : null,
      has_kids: profileData.has_kids,
      wants_kids: profileData.wants_kids,
      smoking: profileData.smoking,
      drinking: profileData.drinking,
    }

    // Build filters JSONB (dealbreakers)
    const filters = {
      age_min: Number(dealbreakers.age_min) || 18,
      age_max: Number(dealbreakers.age_max) || 80,
      seeking_gender: dealbreakers.seeking_gender,
      ...(dealbreakers.filter_has_kids !== '' && { has_kids: dealbreakers.filter_has_kids === 'true' }),
      ...(dealbreakers.filter_wants_kids !== '' && { wants_kids: dealbreakers.filter_wants_kids === 'true' }),
      ...(dealbreakers.filter_smoking.length && { smoking: dealbreakers.filter_smoking }),
      ...(dealbreakers.filter_drinking.length && { drinking: dealbreakers.filter_drinking }),
    }

    // Build soft_prefs JSONB
    const soft_prefs = {
      ...(softPrefs.education && { education: softPrefs.education }),
      ...(softPrefs.religion && { religion: softPrefs.religion }),
      ...(softPrefs.interests.length && { interests: softPrefs.interests }),
    }

    const { data, error } = await upsertProfile({
      id: user.id,
      display_name: profileData.display_name.trim(),
      attributes,
      filters,
      soft_prefs,
      onboarding_complete: true,
    })

    setSaving(false)

    if (error) {
      setSaveError(error.message)
      return
    }

    // data may be null on first upsert in some Supabase versions — fetch it
    if (data) setProfile(data)
    onComplete()
  }

  const currentStep = STEPS[step - 1]

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <p className="font-heading text-urgency text-xs tracking-widest uppercase mb-4">FUSSY</p>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${
                s.id <= step ? 'bg-urgency' : 'bg-border'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            step > currentStep.id ? 'bg-success/20' : 'bg-urgency/15'
          }`}>
            <currentStep.icon size={16} className={step > currentStep.id ? 'text-success' : 'text-urgency'} />
          </div>
          <div>
            <p className="font-mono text-xs text-subdued uppercase tracking-widest">
              Step {step} of {STEPS.length} — {currentStep.label}
            </p>
            <h1 className="font-heading text-xl text-text mt-0.5">{currentStep.headline}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {step === 1 && (
          <>
            {Object.keys(errors).length > 0 && (
              <div className="mb-4 px-3 py-2 bg-urgency/10 border border-urgency/30 rounded-lg">
                <p className="text-xs text-urgency">Please fill in the required fields marked with *</p>
              </div>
            )}
            <StepProfileStats data={profileData} onChange={handleProfileChange} errors={errors} />
          </>
        )}
        {step === 2 && (
          <StepDealbreakers data={dealbreakers} onChange={handleDealbreakerChange} errors={errors} />
        )}
        {step === 3 && (
          <StepSoftPreferences data={softPrefs} onChange={handleSoftPrefChange} />
        )}
      </div>

      {/* Footer nav */}
      <div className="px-5 pb-8 pt-3 flex flex-col gap-3 border-t border-border/50">
        {saveError && (
          <p className="text-xs text-urgency bg-urgency/10 px-3 py-2 rounded-lg">{saveError}</p>
        )}
        <div className="flex gap-3">
        {step > 1 && (
          <Button variant="ghost" onClick={() => { setStep((s) => s - 1); setSaveError(null) }} className="flex-none w-auto px-4">
            <ArrowLeft size={16} />
          </Button>
        )}
        {step < STEPS.length ? (
          <Button onClick={next}>
            Continue <ArrowRight size={16} />
          </Button>
        ) : (
          <Button variant="success" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : <><Check size={16} /> Finish — Let&apos;s go</>}
          </Button>
        )}
        </div>
      </div>
    </div>
  )
}
