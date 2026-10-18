import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Marquee } from './Marquee'
import { MoonPhase } from './MoonPhase'
import { Tag } from './Tag'

describe('MoonPhase', () => {
  it('is exposed as an image when titled', () => {
    render(<MoonPhase fraction={0.5} title="Confident" />)
    expect(screen.getByRole('img', { name: 'Confident' })).toBeInTheDocument()
  })

  it('renders only the outline for a new moon', () => {
    const { container } = render(<MoonPhase fraction={0} />)
    expect(container.querySelector('path')).toBeNull()
  })
})

describe('Marquee', () => {
  it('duplicates items for a seamless loop and hides the copies from screen readers', () => {
    const { container } = render(<Marquee items={['React', 'Django']} />)
    const items = container.querySelectorAll('span.whitespace-nowrap')
    const hidden = container.querySelectorAll('span[aria-hidden="true"].whitespace-nowrap')
    expect(items.length).toBeGreaterThanOrEqual(24)
    expect(hidden.length).toBe(items.length / 2)
  })

  it('renders nothing without items', () => {
    const { container } = render(<Marquee items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('Tag', () => {
  it('renders its label', () => {
    render(<Tag>TypeScript</Tag>)
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })
})
