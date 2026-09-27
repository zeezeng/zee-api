/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
/**
 * The logo is stored in the existing `Logo` option, so an uploaded file is
 * inlined as a data URI instead of being hosted elsewhere. The cap keeps that
 * value small enough for the frequently polled /api/status response.
 */
export const MAX_LOGO_FILE_BYTES = 100 * 1024

export const LOGO_FILE_ACCEPT =
  'image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon'

export type LogoMediaType =
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'image/svg+xml'
  | 'image/x-icon'

/**
 * Media type decided by extension because browsers report an empty or
 * vendor-specific type for SVG and ICO files on some platforms.
 */
export function logoMediaType(fileName: string): LogoMediaType | null {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.ico')) return 'image/x-icon'
  return null
}

export type LogoFileFailure = 'unsupported_type' | 'too_large'

export class LogoFileError extends Error {
  constructor(public reason: LogoFileFailure) {
    super(reason)
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk))
  }
  return btoa(binary)
}

export async function encodeLogoFile(file: File): Promise<string> {
  const mediaType = logoMediaType(file.name)
  if (!mediaType) throw new LogoFileError('unsupported_type')
  if (file.size > MAX_LOGO_FILE_BYTES) throw new LogoFileError('too_large')
  const bytes = new Uint8Array(await file.arrayBuffer())
  return `data:${mediaType};base64,${bytesToBase64(bytes)}`
}

const LOGO_DATA_URI_PATTERN = /^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/]+=*$/i

export function isLogoDataUri(value: string): boolean {
  return LOGO_DATA_URI_PATTERN.test(value)
}

/** Valid logo values are empty, an inlined upload, or an absolute HTTP(S) URL. */
export function isValidLogoValue(value: string): boolean {
  if (value === '') return true
  if (isLogoDataUri(value)) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
