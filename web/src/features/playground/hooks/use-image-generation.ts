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
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { handleServerError } from '@/lib/handle-server-error'

import { generateImages } from '../api'
import { ERROR_MESSAGES } from '../constants'
import { buildImageGenerationPayload } from '../lib'
import type { GeneratedImage, ImageGenerationConfig } from '../types'

/**
 * Base64 image payloads are large, so the gallery keeps only the most recent
 * results in memory and never persists them to storage.
 */
const MAX_KEPT_IMAGES = 12

interface UseImageGenerationOptions {
  config: ImageGenerationConfig
  group: string
}

export function useImageGeneration({
  config,
  group,
}: UseImageGenerationOptions) {
  const { t } = useTranslation()
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const generationRef = useRef(0)

  useEffect(
    () => () => {
      generationRef.current += 1
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
    },
    []
  )

  const generate = useCallback(
    async (prompt: string) => {
      const trimmedPrompt = prompt.trim()
      if (!trimmedPrompt || isGenerating) return

      const generation = generationRef.current + 1
      generationRef.current = generation
      abortControllerRef.current?.abort()
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      setIsGenerating(true)
      setError(null)

      try {
        const payload = buildImageGenerationPayload(
          trimmedPrompt,
          config,
          group
        )
        const generated = await generateImages(payload, abortController.signal)
        if (
          abortController.signal.aborted ||
          generationRef.current !== generation
        ) {
          return
        }

        if (generated.length === 0) {
          setError(t(ERROR_MESSAGES.IMAGE_EMPTY_RESPONSE))
          return
        }

        const batch = generated.map((image) => ({
          ...image,
          prompt: trimmedPrompt,
        }))

        setImages((previous) =>
          [...batch, ...previous].slice(0, MAX_KEPT_IMAGES)
        )
      } catch (requestError: unknown) {
        if (
          abortController.signal.aborted ||
          generationRef.current !== generation
        ) {
          return
        }

        const message =
          requestError instanceof Error && requestError.message
            ? requestError.message
            : t(ERROR_MESSAGES.API_REQUEST_ERROR)
        setError(message)
        handleServerError(new Error(message))
      } finally {
        if (generationRef.current === generation) {
          abortControllerRef.current = null
          setIsGenerating(false)
        }
      }
    },
    [config, group, isGenerating, t]
  )

  const stop = useCallback(() => {
    generationRef.current += 1
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setIsGenerating(false)
  }, [])

  const clearImages = useCallback(() => {
    setImages([])
    setError(null)
  }, [])

  return {
    images,
    isGenerating,
    error,
    generate,
    stop,
    clearImages,
  }
}
