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

import {
  ADVANCED_CUSTOM_INCOMING_PATH_OPTIONS,
  ADVANCED_CUSTOM_TEMPLATE_OPTIONS,
  cloneAdvancedCustomConfig,
  getAdvancedCustomTemplateConfig,
  normalizeAdvancedCustomConfig,
  validateAdvancedCustomConfig,
} from '../advanced-custom'

function templateConfig(key: string) {
  return normalizeAdvancedCustomConfig(getAdvancedCustomTemplateConfig(key))
}

describe('advanced custom route templates', () => {
  test('exposes every incoming path option as a template target', () => {
    const optionValues = new Set(
      ADVANCED_CUSTOM_INCOMING_PATH_OPTIONS.map((option) => option.value)
    )
    expect(optionValues.has('/v1/images/generations')).toBe(true)
    expect(optionValues.has('/v1/images/edits')).toBe(true)
  })

  test('offers an image-only template that never claims a text protocol route', () => {
    const template = ADVANCED_CUSTOM_TEMPLATE_OPTIONS.find(
      (option) => option.value === 'openai_image_only'
    )
    expect(template).toBeDefined()

    const routes = templateConfig('openai_image_only').advanced_routes || []
    expect(routes.map((route) => route.incoming_path)).toEqual([
      '/v1/images/generations',
      '/v1/images/edits',
    ])
    for (const route of routes) {
      expect(route.converter).toBe('none')
      expect(route.upstream_path).toBe(route.incoming_path)
    }
  })

  test('passes the editor validation the dialog runs before saving', () => {
    for (const option of ADVANCED_CUSTOM_TEMPLATE_OPTIONS) {
      const config = templateConfig(option.value)
      expect(validateAdvancedCustomConfig(config), option.value).toBeNull()
    }
  })

  test('clones templates so editing one does not mutate the shared preset', () => {
    const first = cloneAdvancedCustomConfig(
      getAdvancedCustomTemplateConfig('openai_image_only')
    )
    first.advanced_routes![0].upstream_path = '/changed'

    expect(
      templateConfig('openai_image_only').advanced_routes?.[0].upstream_path
    ).toBe('/v1/images/generations')
  })
})
