import { Store } from '@tanstack/store'

interface UIState {
  restDayModalOpen: boolean
  endDayModalOpen: boolean
  selectedDate: string
}

const today = new Date().toISOString().split('T')[0]

export const uiStore = new Store<UIState>({
  restDayModalOpen: false,
  endDayModalOpen: false,
  selectedDate: today,
})
