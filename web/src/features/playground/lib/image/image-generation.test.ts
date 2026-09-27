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
import { describe, expect, test } from 'vitest'

import { IMAGE_QUALITY_ANY, DEFAULT_IMAGE_CONFIG } from '../../constants'
import type { ImageGenerationConfig } from '../../types'
import {
  buildImageGenerationPayload,
  parseImageGenerationResponse,
} from './image-generation'

const baseConfig: ImageGenerationConfig = {
  ...DEFAULT_IMAGE_CONFIG,
  model: 'tt-image-2.5',
}

describe('buildImageGenerationPayload', () => {
  test('sends the prompt, model, group and count', () => {
    const payload = buildImageGenerationPayload('a cat', baseConfig, 'default')

    expect(payload).toEqual({
      model: 'tt-image-2.5',
      group: 'default',
      prompt: 'a cat',
      size: '1024x1024',
      n: 1,
    })
  })

  test('omits quality while it is the upstream-default sentinel', () => {
    const payload = buildImageGenerationPayload(
      'a cat',
      {
        ...baseConfig,
        quality: IMAGE_QUALITY_ANY,
      },
      'default'
    )

    expect(payload).not.toHaveProperty('quality')
  })

  test('keeps a concrete quality and trims the size', () => {
    const payload = buildImageGenerationPayload(
      'a cat',
      {
        ...baseConfig,
        quality: 'high',
        size: ' 1536x1024 ',
      },
      'default'
    )

    expect(payload.quality).toBe('high')
    expect(payload.size).toBe('1536x1024')
  })

  test('drops a blank size so the upstream keeps its own default', () => {
    const payload = buildImageGenerationPayload(
      'a cat',
      {
        ...baseConfig,
        size: '   ',
      },
      'default'
    )

    expect(payload).not.toHaveProperty('size')
  })
})

describe('parseImageGenerationResponse', () => {
  test('returns remote urls as-is', () => {
    const images = parseImageGenerationResponse({
      data: [{ url: 'https://example.com/a.png', revised_prompt: 'better' }],
    })

    expect(images).toEqual([
      {
        key: 'image-0',
        src: 'https://example.com/a.png',
        remoteUrl: 'https://example.com/a.png',
        revisedPrompt: 'better',
      },
    ])
  })

  test('wraps base64 payloads in a data url using the sniffed media type', () => {
    const png = parseImageGenerationResponse({
      data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUg==' }],
    })
    const jpeg = parseImageGenerationResponse({
      data: [{ b64_json: '/9j/4AAQSkZJRg==' }],
    })

    expect(png[0].src.startsWith('data:image/png;base64,')).toBe(true)
    expect(jpeg[0].src.startsWith('data:image/jpeg;base64,')).toBe(true)
  })

  test('passes an existing data url through untouched', () => {
    const images = parseImageGenerationResponse({
      data: [{ b64_json: 'data:image/webp;base64,UklGRg==' }],
    })

    expect(images[0].src).toBe('data:image/webp;base64,UklGRg==')
  })

  test('accepts a single object instead of an array', () => {
    const images = parseImageGenerationResponse({
      data: { url: 'https://example.com/one.png' },
    })

    expect(images).toHaveLength(1)
  })

  test('drops entries without any image payload', () => {
    const images = parseImageGenerationResponse({
      data: [
        { url: '' },
        { b64_json: '' },
        { url: 'https://example.com/b.png' },
      ],
    })

    expect(images).toHaveLength(1)
    expect(images[0].src).toBe('https://example.com/b.png')
  })

  test('returns an empty list for unrecognizable payloads', () => {
    expect(parseImageGenerationResponse(null)).toEqual([])
    expect(parseImageGenerationResponse({})).toEqual([])
    expect(parseImageGenerationResponse('nope')).toEqual([])
  })
})
