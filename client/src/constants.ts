import type { ModelOption } from './types'

export interface SampleImage {
  id: string
  name: string
  label: string
  path: string
}

export const SAMPLE_IMAGES: SampleImage[] = [
  { id: '1', name: 'sample_1.jpg', label: 'Sampel #1', path: '/samples/sample_1.jpg' },
  { id: '2', name: 'sample_2.jpg', label: 'Sampel #2', path: '/samples/sample_2.jpg' },
  { id: '7', name: 'sample_7.jpg', label: 'Sampel #7', path: '/samples/sample_7.jpg' },
  { id: '16', name: 'sample_16.jpg', label: 'Sampel #16', path: '/samples/sample_16.jpg' },
  { id: '20', name: 'sample_20.jpg', label: 'Sampel #20', path: '/samples/sample_20.jpg' },
  { id: '45', name: 'sample_45.jpg', label: 'Sampel #45', path: '/samples/sample_45.jpg' },
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
