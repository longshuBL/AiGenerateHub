export interface ImageGenerationRequest {
  prompt: string;
  negative_prompt?: string;
  style?: string;
  width?: number;
  height?: number;
  n?: number;
  seed?: number;
}

export interface ImageGenerationResponse {
  imageUrl: string;
  model: string;
  credits: number;
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
} 