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
import { IMAGE_QUALITY_ANY } from '../../constants'
import type {
  GeneratedImage,
  ImageGenerationConfig,
  ImageGenerationRequest,
} from '../../types'

type ImageDataEntry = {
  url?: unknown
  b64_json?: unknown
  revised_prompt?: unknown
}

/**
 * Build the request payload for /pg/images/generations. Blank optional fields
 * are omitted so each upstream keeps its own default instead of receiving an
 * empty string it may reject.
 */
export function buildImageGenerationPayload(
  prompt: string,
  config: ImageGenerationConfig,
  group: string
): ImageGenerationRequest {
  const payload: ImageGenerationRequest = {
    model: config.model,
    group,
    prompt,
    n: config.n,
  }

  if (config.size.trim()) {
    payload.size = config.size.trim()
  }

  if (config.quality.trim() && config.quality !== IMAGE_QUALITY_ANY) {
    payload.quality = config.quality.trim()
  }

  return payload
}

/**
 * Resolve the media type of a base64 image payload from its magic bytes. Most
 * upstreams return PNG, but a wrong media type makes the browser render
 * nothing, so sniff the common formats instead of assuming.
 */
function base64MediaType(base64: string): string {
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png'
  if (base64.startsWith('/9j/')) return 'image/jpeg'
  if (base64.startsWith('UklGR')) return 'image/webp'
  if (base64.startsWith('R0lGOD')) return 'image/gif'
  return 'image/png'
}

/**
 * Normalize one image entry into something `<img src>` can render. Entries
 * carrying neither a URL nor a base64 payload are dropped.
 */
function toGeneratedImage(
  entry: ImageDataEntry,
  index: number
): GeneratedImage | null {
  const revisedPrompt =
    typeof entry.revised_prompt === 'string' && entry.revised_prompt
      ? entry.revised_prompt
      : undefined

  if (typeof entry.url === 'string' && entry.url) {
    const url = entry.url
    return {
      key: `image-${index}`,
      src: url,
      remoteUrl: url.startsWith('http') ? url : undefined,
      revisedPrompt,
    }
  }

  if (typeof entry.b64_json === 'string' && entry.b64_json) {
    const base64 = entry.b64_json
    return {
      key: `image-${index}`,
      src: base64.startsWith('data:')
        ? base64
        : `data:${base64MediaType(base64)};base64,${base64}`,
      revisedPrompt,
    }
  }

  return null
}

/**
 * Parse an image generation response into renderable images. Accepts the
 * OpenAI `data` array shape as well as the single-object variant some gateways
 * return, and returns an empty list for anything unrecognizable.
 */
export function parseImageGenerationResponse(
  payload: unknown
): GeneratedImage[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const data = (payload as { data?: unknown }).data
  if (!data) {
    return []
  }

  const entries: ImageDataEntry[] = Array.isArray(data)
    ? (data as ImageDataEntry[])
    : [data as ImageDataEntry]

  return entries
    .map((entry, index) => toGeneratedImage(entry, index))
    .filter((image): image is GeneratedImage => image !== null)
}
