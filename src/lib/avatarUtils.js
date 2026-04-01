/**
 * Generate a consistent gradient + text colour from any display name.
 * Same name always produces the same gradient — looks intentional, not random.
 */

const GRADIENTS = [
  ['#F9A8D4', '#FBBF24'],  // pink → amber
  ['#FCA5A5', '#FB923C'],  // red → orange
  ['#A5B4FC', '#818CF8'],  // indigo
  ['#6EE7B7', '#3B82F6'],  // emerald → blue
  ['#FDE68A', '#F59E0B'],  // yellow → amber
  ['#C4B5FD', '#F472B6'],  // purple → pink
  ['#86EFAC', '#34D399'],  // green
  ['#FCA5A5', '#F472B6'],  // rose → pink
  ['#BAE6FD', '#818CF8'],  // sky → indigo
  ['#FED7AA', '#FB923C'],  // peach → orange
]

function hashName(name = '') {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  }
  return Math.abs(h)
}

export function getAvatarGradient(name = '') {
  const pair = GRADIENTS[hashName(name) % GRADIENTS.length]
  return `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`
}

export function getAvatarTextColor(name = '') {
  // All gradient pairs are light enough that white text works
  return '#FFFFFF'
}
