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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { beforeEach, expect, test, vi } from 'vitest'

import { api } from '@/lib/api'

import { SettingsPageProvider } from '../../components/settings-page-context'
import { MAX_LOGO_FILE_BYTES } from '../logo-file'
import { SystemInfoSection } from '../system-info-section'

const defaultValues = {
  SystemName: 'Gateway',
  ServerAddress: '',
  TaskPublicAddress: '',
  Logo: '',
  Footer: '',
  About: '',
  general_setting: { docs_link: '' },
  legal: { user_agreement: '', privacy_policy: '' },
}

function Fixture() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  return (
    <>
      <div ref={setContainer} />
      <SettingsPageProvider actionsContainer={container}>
        <SystemInfoSection defaultValues={defaultValues} />
      </SettingsPageProvider>
    </>
  )
}

async function renderSettings() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createRouter({
    routeTree: createRootRoute({ component: Fixture }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  const view = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
  const input = await screen.findByRole('textbox', { name: 'Logo URL' })
  const fileInput =
    view.container.querySelector<HTMLInputElement>('input[type="file"]')
  if (!fileInput) throw new Error('logo file input not rendered')
  return { input, fileInput }
}

const pngDataUri = `data:image/png;base64,${btoa('png-bytes')}`

beforeEach(() => {
  vi.spyOn(api, 'put').mockResolvedValue({ data: { success: true } })
})

test('uploads an image and stores it as a data URI', async () => {
  const { input, fileInput } = await renderSettings()
  fireEvent.change(fileInput, {
    target: {
      files: [new File(['png-bytes'], 'logo.png', { type: 'image/png' })],
    },
  })
  await waitFor(() => expect(input).toHaveValue(pngDataUri))
})

test('rejects an oversized file and keeps the current logo', async () => {
  const error = vi.spyOn(toast, 'error')
  const { input, fileInput } = await renderSettings()
  fireEvent.change(fileInput, {
    target: {
      files: [new File([new Uint8Array(MAX_LOGO_FILE_BYTES + 1)], 'logo.png')],
    },
  })
  await waitFor(() =>
    expect(error).toHaveBeenCalledWith('Logo file must be 100 KB or smaller')
  )
  expect(input).toHaveValue('')
})

test('rejects an unsupported image type', async () => {
  const error = vi.spyOn(toast, 'error')
  const { fileInput } = await renderSettings()
  fireEvent.change(fileInput, {
    target: { files: [new File(['x'], 'logo.gif', { type: 'image/gif' })] },
  })
  await waitFor(() =>
    expect(error).toHaveBeenCalledWith(
      'Unsupported image type. Use PNG, JPG, WebP, SVG, or ICO.'
    )
  )
})

test('rejects a non-image logo value and saves an uploaded data URI', async () => {
  const { input, fileInput } = await renderSettings()
  fireEvent.change(input, { target: { value: 'not-a-url' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
  await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'))
  expect(
    screen.getByText('Enter an HTTP(S) image URL or upload an image file')
  ).toBeInTheDocument()
  expect(api.put).not.toHaveBeenCalled()

  fireEvent.change(fileInput, {
    target: {
      files: [new File(['png-bytes'], 'logo.png', { type: 'image/png' })],
    },
  })
  await waitFor(() => expect(input).toHaveValue(pngDataUri))
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
  await waitFor(() =>
    expect(api.put).toHaveBeenCalledWith('/api/option/', {
      key: 'Logo',
      value: pngDataUri,
    })
  )
})
