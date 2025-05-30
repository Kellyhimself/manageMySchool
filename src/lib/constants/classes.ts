export const CLASS_OPTIONS = {
  'Early Childhood': [
    'Baby Class',
    'Pre-Primary 1 (PP1)',
    'Pre-Primary 2 (PP2)',
  ],
  'Primary': [
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
  ],
  'Junior Secondary': [
    'Grade 7',
    'Grade 8',
    'Grade 9',
  ],
  'Senior Secondary': [
    'Form 1',
    'Form 2',
    'Form 3',
    'Form 4',
  ],
} as const

export type ClassOption = typeof CLASS_OPTIONS[keyof typeof CLASS_OPTIONS][number]

export const ALL_CLASS_OPTIONS = Object.values(CLASS_OPTIONS).flat() 