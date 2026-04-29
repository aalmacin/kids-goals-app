'use client'

import { useState } from 'react'
import {
  Star, Heart, Sun, Moon, Cloud, Zap, Music, Book,
  Brush, Scissors, ShoppingCart, Coffee, Pizza, Apple,
  Dog, Cat, Fish, Flower2, Trees, Leaf, Droplets, Flame,
  Smile, Trophy, Medal, Crown, Diamond, Gem, Gift, Rocket,
} from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

const ICONS: { name: string; Component: React.ComponentType<{ className?: string }> }[] = [
  { name: 'star', Component: Star },
  { name: 'heart', Component: Heart },
  { name: 'sun', Component: Sun },
  { name: 'moon', Component: Moon },
  { name: 'cloud', Component: Cloud },
  { name: 'zap', Component: Zap },
  { name: 'music', Component: Music },
  { name: 'book', Component: Book },
  { name: 'brush', Component: Brush },
  { name: 'scissors', Component: Scissors },
  { name: 'shopping-cart', Component: ShoppingCart },
  { name: 'coffee', Component: Coffee },
  { name: 'pizza', Component: Pizza },
  { name: 'apple', Component: Apple },
  { name: 'dog', Component: Dog },
  { name: 'cat', Component: Cat },
  { name: 'fish', Component: Fish },
  { name: 'flower', Component: Flower2 },
  { name: 'tree', Component: Trees },
  { name: 'leaf', Component: Leaf },
  { name: 'droplets', Component: Droplets },
  { name: 'flame', Component: Flame },
  { name: 'smile', Component: Smile },
  { name: 'trophy', Component: Trophy },
  { name: 'medal', Component: Medal },
  { name: 'crown', Component: Crown },
  { name: 'diamond', Component: Diamond },
  { name: 'gem', Component: Gem },
  { name: 'gift', Component: Gift },
  { name: 'rocket', Component: Rocket },
]

interface IconPickerProps {
  name: string
  defaultValue?: string
}

export function IconPicker({ name, defaultValue = 'star' }: IconPickerProps) {
  const [selected, setSelected] = useState(defaultValue)

  return (
    <div>
      <input type="hidden" name={name} value={selected} />
      <div className="grid grid-cols-8 gap-1 p-2 border rounded-lg bg-white max-h-48 overflow-y-auto">
        {ICONS.map(({ name: iconName, Component }) => (
          <button
            key={iconName}
            type="button"
            onClick={() => setSelected(iconName)}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              selected === iconName
                ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400'
                : 'hover:bg-gray-100 text-gray-600'
            )}
            title={iconName}
          >
            <Component className="w-4 h-4" />
          </button>
        ))}
      </div>
    </div>
  )
}

export function IconDisplay({ iconName, className }: { iconName: string; className?: string }) {
  const found = ICONS.find((i) => i.name === iconName)
  if (!found) return <Star className={cn('w-5 h-5', className)} />
  const { Component } = found
  return <Component className={cn('w-5 h-5', className)} />
}
