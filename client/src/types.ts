export interface PredictionCandidate {
  rank: number
  class_name: string
  confidence: number
  percentage: string
}

export interface AlgorithmResult {
  algorithm_id: string
  algorithm_name: string
  top_prediction: string
  confidence: number
  percentage: string
  processing_time_ms: number
  top_5: PredictionCandidate[]
}

export interface AllAlgorithmsResponse {
  filename: string
  total_processing_time_ms: number
  results: Record<string, AlgorithmResult>
}

export interface HealthResponse {
  status: string
  loaded_models: Record<string, boolean>
  total_classes: number
}

export interface ClassListResponse {
  total_classes: number
  classes: string[]
}

export interface ModelOption {
  id: 'svm' | 'rf' | 'mobilenetv2'
  name: string
  badge: string
  technique: string
  description: string
  tagColor: string
}
