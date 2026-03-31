import { signOut } from '../lib/supabaseClient'
import useAuthStore from '../store/useAuthStore'
import { Button } from '../components/ui/Button'
import { LogOut, User } from 'lucide-react'

export default function Profile() {
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)

  const attrs = profile?.attributes ?? {}
  const filters = profile?.filters ?? {}
  const prefs = profile?.soft_prefs ?? {}

  const statRows = [
    { label: 'Age', value: attrs.age },
    { label: 'Gender', value: attrs.gender },
    { label: 'City', value: attrs.location_city },
    { label: 'Height', value: attrs.height_cm ? `${attrs.height_cm}cm` : null },
    { label: 'Kids', value: attrs.has_kids === true ? 'Has kids' : attrs.has_kids === false ? 'No kids' : null },
    { label: 'Wants kids', value: attrs.wants_kids === true ? 'Yes' : attrs.wants_kids === false ? 'No' : null },
    { label: 'Smoking', value: attrs.smoking },
    { label: 'Drinking', value: attrs.drinking },
  ].filter((r) => r.value != null)

  return (
    <div className="flex flex-col flex-1 px-4 pt-2 pb-8">
      <h1 className="font-heading text-xl mb-5">Profile</h1>

      {/* Identity */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            <User size={22} className="text-subdued" />
          )}
        </div>
        <div>
          <p className="font-heading text-lg">{profile?.display_name ?? '—'}</p>
          <p className="text-xs text-subdued">{user?.email}</p>
        </div>
      </div>

      {statRows.length > 0 && (
        <div className="card mb-4">
          <p className="section-label">My Stats</p>
          <div className="space-y-2 mt-2">
            {statRows.map((r) => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-subdued">{r.label}</span>
                <span className="text-text capitalize">{String(r.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {filters.seeking_gender?.length > 0 && (
        <div className="card mb-4">
          <p className="section-label">Dealbreakers</p>
          <div className="space-y-2 mt-2 text-sm">
            <div className="flex justify-between">
              <span className="text-subdued">Age range</span>
              <span className="text-text font-mono">{filters.age_min}–{filters.age_max}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-subdued">Seeking</span>
              <span className="text-text capitalize">{filters.seeking_gender?.join(', ')}</span>
            </div>
          </div>
        </div>
      )}

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

      <div className="mt-auto">
        <Button variant="ghost" onClick={signOut}>
          <LogOut size={15} /> Sign Out
        </Button>
      </div>
    </div>
  )
}
