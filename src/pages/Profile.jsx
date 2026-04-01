import { useRef, useState } from 'react'
import { signOut, uploadAvatar, getAvatarUrl, verifyPhoto, upsertProfile } from '../lib/supabaseClient'
import useAuthStore from '../store/useAuthStore'
import { LogOut, Camera, CheckCircle, AlertCircle, Loader } from 'lucide-react'

// ---------------------------------------------------------------------------
// Photo upload states
// ---------------------------------------------------------------------------
const UPLOAD_IDLE    = 'idle'
const UPLOAD_LOADING = 'loading'
const UPLOAD_OK      = 'ok'
const UPLOAD_FAIL    = 'fail'

export default function Profile() {
  const profile  = useAuthStore((s) => s.profile)
  const user     = useAuthStore((s) => s.user)
  const setProfile = useAuthStore((s) => s.setProfile)

  const fileRef = useRef(null)
  const [uploadState, setUploadState] = useState(UPLOAD_IDLE)
  const [uploadMsg, setUploadMsg]     = useState('')

  const attrs   = profile?.attributes ?? {}
  const filters = profile?.filters    ?? {}
  const prefs   = profile?.soft_prefs ?? {}

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

  // ── Photo upload ──────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    // Basic client-side validation
    if (!file.type.startsWith('image/')) {
      setUploadState(UPLOAD_FAIL); setUploadMsg('Please choose an image file.'); return
    }
    if (file.size > 6 * 1024 * 1024) {
      setUploadState(UPLOAD_FAIL); setUploadMsg('Image must be smaller than 6 MB.'); return
    }

    setUploadState(UPLOAD_LOADING)
    setUploadMsg('Uploading…')

    // 1. Upload to Supabase Storage
    const { error: uploadError, path } = await uploadAvatar(user.id, file)
    if (uploadError) {
      setUploadState(UPLOAD_FAIL); setUploadMsg(uploadError.message); return
    }

    setUploadMsg('Verifying with AI…')

    // 2. Ask the Edge Function if it's a real human photo
    const { data: verifyData, error: verifyError } = await verifyPhoto(path)
    if (verifyError || !verifyData?.valid) {
      // Clean up the invalid upload
      setUploadState(UPLOAD_FAIL)
      setUploadMsg(verifyData?.reason ?? verifyError?.message ?? 'Photo could not be verified as a real person.')
      return
    }

    // 3. Get public URL and save to profile
    const publicUrl = getAvatarUrl(path)
    const { data: updatedProfile } = await upsertProfile({
      id: user.id,
      avatar_url: publicUrl,
    })

    if (updatedProfile) setProfile(updatedProfile)
    else setProfile({ ...profile, avatar_url: publicUrl })

    setUploadState(UPLOAD_OK)
    setUploadMsg('Photo verified and saved!')
    setTimeout(() => setUploadState(UPLOAD_IDLE), 3000)
  }

  const avatarUrl = profile?.avatar_url
  const initial   = profile?.display_name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="flex flex-col flex-1 px-4 pt-4 pb-10">
      <h1 className="font-heading text-xl text-white mb-6">Profile</h1>

      {/* Avatar + upload */}
      <div className="flex items-center gap-4 mb-7">
        <div className="relative flex-none">
          <div
            className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="font-heading text-xl" style={{ color: 'rgba(255,255,255,0.25)' }}>{initial}</span>
            )}
          </div>

          {/* Camera button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadState === UPLOAD_LOADING}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
            style={{
              background: '#FF3B30',
              border: '2px solid #0D0D0F',
              boxShadow: '0 2px 8px rgba(255,59,48,0.4)',
            }}
          >
            {uploadState === UPLOAD_LOADING
              ? <Loader size={11} className="text-white animate-spin" />
              : <Camera size={11} className="text-white" />
            }
          </button>

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="min-w-0">
          <p className="font-heading text-lg text-white truncate">{profile?.display_name ?? '—'}</p>
          <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{user?.email}</p>
        </div>
      </div>

      {/* Upload status message */}
      {uploadState !== UPLOAD_IDLE && (
        <div
          className="mb-4 px-3 py-2.5 rounded-xl flex items-center gap-2 animate-fade-in"
          style={uploadState === UPLOAD_OK
            ? { background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.25)' }
            : uploadState === UPLOAD_FAIL
            ? { background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.25)' }
            : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }
          }
        >
          {uploadState === UPLOAD_OK   && <CheckCircle size={14} style={{ color: '#34C759', flexShrink: 0 }} />}
          {uploadState === UPLOAD_FAIL && <AlertCircle size={14} style={{ color: '#FF3B30', flexShrink: 0 }} />}
          {uploadState === UPLOAD_LOADING && <Loader size={14} className="animate-spin flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />}
          <span className="text-xs leading-snug"
            style={{
              color: uploadState === UPLOAD_OK   ? '#34C759'
                   : uploadState === UPLOAD_FAIL ? '#FF6B63'
                   : 'rgba(255,255,255,0.45)',
            }}
          >
            {uploadMsg}
          </span>
        </div>
      )}

      {/* AI verification note */}
      {!avatarUrl && uploadState === UPLOAD_IDLE && (
        <div className="mb-4 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Add a real photo — our AI checks every upload is a genuine person, not AI-generated or fake.
          </p>
        </div>
      )}

      {/* My Stats */}
      {statRows.length > 0 && (
        <div className="card mb-4">
          <p className="section-label">My Stats</p>
          <div className="space-y-2.5 mt-2">
            {statRows.map((r) => (
              <div key={r.label} className="flex justify-between text-sm">
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>{r.label}</span>
                <span className="text-white capitalize">{String(r.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dealbreakers */}
      {filters.seeking_gender?.length > 0 && (
        <div className="card mb-4">
          <p className="section-label">Dealbreakers</p>
          <div className="space-y-2.5 mt-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Age range</span>
              <span className="font-mono text-white">{filters.age_min}–{filters.age_max}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Seeking</span>
              <span className="text-white capitalize">{filters.seeking_gender?.join(', ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Interests */}
      {prefs.interests?.length > 0 && (
        <div className="card mb-6">
          <p className="section-label">Interests</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {prefs.interests.map((i) => (
              <span key={i} className="tag capitalize">{i}</span>
            ))}
          </div>
        </div>
      )}

      {/* Sign out */}
      <div className="mt-auto pt-2">
        <button
          onClick={signOut}
          className="w-full py-3.5 px-5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all duration-200 active:scale-[0.98]"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  )
}
