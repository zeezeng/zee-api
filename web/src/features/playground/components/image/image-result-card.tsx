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
import { DownloadIcon, ExternalLinkIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import type { GeneratedImage } from '../../types'

interface ImageResultCardProps {
  image: GeneratedImage
}

function isInlineImage(src: string): boolean {
  return src.startsWith('data:')
}

export function ImageResultCard({ image }: ImageResultCardProps) {
  const { t } = useTranslation()
  const inline = isInlineImage(image.src)

  const handleAction = () => {
    if (inline) {
      // A data URL cannot be opened as a top-level document in Chrome, so save
      // it directly instead of navigating to it.
      const link = document.createElement('a')
      link.href = image.src
      link.download = `${image.key}.png`
      link.click()
      return
    }

    window.open(image.src, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card className='gap-0 overflow-hidden py-0'>
      <img
        alt={image.prompt ?? t('Generated image')}
        className='bg-muted/30 h-auto w-full object-contain'
        loading='lazy'
        src={image.src}
      />

      <div className='space-y-2 p-3'>
        {image.prompt && (
          <p className='text-muted-foreground line-clamp-3 text-xs leading-5'>
            {image.prompt}
          </p>
        )}

        {image.revisedPrompt && (
          <p className='text-muted-foreground line-clamp-3 text-xs leading-5 italic'>
            {t('Revised prompt')}: {image.revisedPrompt}
          </p>
        )}

        <Button
          className='w-full'
          onClick={handleAction}
          size='sm'
          type='button'
          variant='outline'
        >
          {inline ? (
            <>
              <DownloadIcon aria-hidden='true' className='size-4' />
              {t('Download')}
            </>
          ) : (
            <>
              <ExternalLinkIcon aria-hidden='true' className='size-4' />
              {t('Open in new tab')}
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
