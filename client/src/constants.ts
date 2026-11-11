import type { ModelOption } from './types'

export interface SampleImage {
  id: string
  name: string
  label: string
  path: string
}

export const SAMPLE_IMAGES: SampleImage[] = [
  { id: 'A250002', name: 'sample_A250002.jpg', label: 'A250002', path: '/samples/sample_A250002.jpg' },
  { id: 'A250007', name: 'sample_A250007.jpg', label: 'A250007', path: '/samples/sample_A250007.jpg' },
  { id: 'A250014', name: 'sample_A250014.jpg', label: 'A250014', path: '/samples/sample_A250014.jpg' },
  { id: 'A250015', name: 'sample_A250015.jpg', label: 'A250015', path: '/samples/sample_A250015.jpg' },
  { id: 'A250023', name: 'sample_A250023.jpg', label: 'A250023', path: '/samples/sample_A250023.jpg' },
  { id: 'A250041', name: 'sample_A250041.jpg', label: 'A250041', path: '/samples/sample_A250041.jpg' },
]

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'svm',
    name: 'SVM + GLCM',
    badge: 'Machine Learning',
    technique: 'Support Vector Machine & Fitur Tekstur Haralick',
    description:
      'Mengekstrak 24 fitur GLCM (Contrast, Homogeneity, Energy, Correlation, dll) dan diklasifikasi dengan kernel RBF terstandarisasi.',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'rf',
    name: 'Random Forest + GLCM',
    badge: 'Ensemble Learning',
    technique: 'Ensemble 100 Decision Trees & Haralick',
    description:
      'Menggabungkan ratusan pohon keputusan berbasis fitur tekstur citra tulisan untuk estimasi probabilitas yang stabil.',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'mobilenetv2',
    name: 'MobileNetV2',
    badge: 'Deep Learning',
    technique: 'Transfer Learning CNN (128x128 RGB)',
    description:
      'Arsitektur Convolutional Neural Network modern yang mengekstraksi representasi spasial mendalam langsung dari citra piksel.',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
]
