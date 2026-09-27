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
import { ImageIcon, SquareIcon, SparklesIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'
import { ModelGroupSelector } from '@/components/model-group-selector'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  IMAGE_QUALITY_OPTIONS,
  IMAGE_SIZE_PRESETS,
  MAX_IMAGE_N,
} from '../../constants'
import type {
  GeneratedImage,
  GroupOption,
  ImageGenerationConfig,
  ModelOption,
} from '../../types'
import { ImageResultCard } from './image-result-card'

interface PlaygroundImageProps {
  config: ImageGenerationConfig
  models: ModelOption[]
  groups: GroupOption[]
  groupValue: string
  isModelLoading?: boolean
  isGenerating: boolean
  images: GeneratedImage[]
  error: string | null
  onConfigChange: <K extends keyof ImageGenerationConfig>(
    key: K,
    value: ImageGenerationConfig[K]
  ) => void
  onGroupChange: (value: string) => void
  onGenerate: (prompt: string) => void
  onStop: () => void
  onClearImages: () => void
}

export function PlaygroundImage({
  config,
  models,
  groups,
  groupValue,
  isModelLoading = false,
  isGenerating,
  images,
  error,
  onConfigChange,
  onGroupChange,
  onGenerate,
  onStop,
  onClearImages,
}: PlaygroundImageProps) {
  const { t } = useTranslation()
  const [prompt, setPrompt] = useState('')
  // The count input keeps its own draft so a half-typed value ('' while
  // retyping) is not immediately clamped back to the committed one.
  const [countDraft, setCountDraft] = useState(String(config.n))

  useEffect(() => {
    setCountDraft(String(config.n))
  }, [config.n])

  const canGenerate =
    Boolean(config.model) && Boolean(prompt.trim()) && !isGenerating

  const handleSubmit = () => {
    const trimmedPrompt = prompt.trim()
    if (!config.model || !trimmedPrompt || isGenerating) return
    onGenerate(trimmedPrompt)
  }

  const handleCountChange = (value: string) => {
    setCountDraft(value)

    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed)) return
    onConfigChange('n', Math.min(Math.max(parsed, 1), MAX_IMAGE_N))
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
      <div className='min-h-0 flex-1 overflow-y-auto px-1'>
        <div className='mx-auto w-full max-w-4xl py-4'>
          {error && (
            <Alert className='mb-4' variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {images.length === 0 ? (
            <div className='text-muted-foreground flex min-h-60 flex-col items-center justify-center gap-3 text-center'>
              <ImageIcon aria-hidden='true' className='size-10 opacity-40' />
              <div className='space-y-1'>
                <p className='text-foreground text-sm font-medium'>
                  {t('No images yet')}
                </p>
                <p className='text-xs'>
                  {t(
                    'Pick an image model, describe what you want, then generate.'
                  )}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className='mb-3 flex items-center justify-between'>
                <p className='text-muted-foreground text-xs'>
                  {t('Generated images')}
                </p>
                <Button
                  onClick={onClearImages}
                  size='sm'
                  type='button'
                  variant='ghost'
                >
                  <Trash2Icon aria-hidden='true' className='size-4' />
                  {t('Clear')}
                </Button>
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {images.map((image) => (
                  <ImageResultCard image={image} key={image.key} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className='mx-auto w-full max-w-4xl shrink-0 px-1 md:pb-4'>
        <PromptInput
          className='relative'
          groupClassName='bg-background/95 dark:bg-background/80 border-border/70 shadow-[0_18px_60px_-32px_rgba(0,0,0,0.65)] ring-1 ring-foreground/5 rounded-xl overflow-hidden transition-all duration-200 focus-within:border-primary/45 focus-within:ring-primary/15 focus-within:shadow-[0_22px_70px_-34px_rgba(0,0,0,0.75)]'
          onSubmit={handleSubmit}
        >
          <div className='grid gap-3 px-5 pt-4 sm:grid-cols-3'>
            <div className='space-y-1.5'>
              <Label className='text-xs' htmlFor='playground-image-size'>
                {t('Size')}
              </Label>
              <Input
                id='playground-image-size'
                onChange={(event) => onConfigChange('size', event.target.value)}
                placeholder='1024x1024'
                value={config.size}
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs' htmlFor='playground-image-quality'>
                {t('Quality')}
              </Label>
              <Select
                onValueChange={(value) => {
                  if (value) onConfigChange('quality', value)
                }}
                value={config.quality}
              >
                <SelectTrigger id='playground-image-quality'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_QUALITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs' htmlFor='playground-image-count'>
                {t('Count')}
              </Label>
              <Input
                id='playground-image-count'
                max={MAX_IMAGE_N}
                min={1}
                onChange={(event) => handleCountChange(event.target.value)}
                type='number'
                value={countDraft}
              />
            </div>
          </div>

          <div className='flex flex-wrap gap-1.5 px-5 pt-3'>
            {IMAGE_SIZE_PRESETS.map((preset) => (
              <Button
                key={preset}
                onClick={() => onConfigChange('size', preset)}
                size='sm'
                type='button'
                variant={config.size === preset ? 'secondary' : 'ghost'}
              >
                {preset}
              </Button>
            ))}
          </div>

          <PromptInputTextarea
            autoComplete='off'
            autoCorrect='off'
            autoCapitalize='off'
            className='min-h-20 px-5 pt-3 pb-3 leading-7 md:min-h-24 md:text-base'
            disabled={isGenerating}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={t('Describe the image you want to generate')}
            spellCheck={false}
            value={prompt}
          />

          <PromptInputFooter className='border-border/60 bg-muted/20 dark:bg-muted/10 border-t px-3 py-2.5 backdrop-blur'>
            <div className='flex w-full flex-col gap-2.5 md:flex-row md:items-center md:justify-between'>
              <ModelGroupSelector
                disabled={isModelLoading}
                groups={groups}
                models={models}
                onGroupChange={onGroupChange}
                onModelChange={(value) => onConfigChange('model', value)}
                selectedGroup={groupValue}
                selectedModel={config.model}
              />

              {isGenerating ? (
                <PromptInputButton
                  className='border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/15 font-medium'
                  onClick={onStop}
                  variant='secondary'
                >
                  <SquareIcon className='fill-current' size={16} />
                  {t('Stop')}
                </PromptInputButton>
              ) : (
                <PromptInputButton
                  className='bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground h-8 px-3 font-medium shadow-sm'
                  disabled={!canGenerate}
                  type='submit'
                  variant='default'
                >
                  <SparklesIcon size={16} />
                  {t('Generate')}
                </PromptInputButton>
              )}
            </div>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )
}
