const TRACK_URL_REGEX = /spotify\.com\/track\/([a-zA-Z0-9]{22})/
const TRACK_ID_REGEX = /^[a-zA-Z0-9]{22}$/

export function extractTrackId(input: string): string | null {
  const urlMatch = input.match(TRACK_URL_REGEX)
  if (urlMatch) return urlMatch[1]
  if (TRACK_ID_REGEX.test(input)) return input
  return null
}
