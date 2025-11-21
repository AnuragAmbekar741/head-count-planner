import { useMutation } from "@tanstack/react-query";
import {
  nlpToTemplate,
  type NLPToTemplateRequest,
  type NLPToTemplateResponse,
} from "@/api/llm";
import { AxiosError } from "axios";

interface LLMError {
  message: string;
  detail?: string;
}

export const useNlpToTemplate = () => {
  return useMutation<
    NLPToTemplateResponse,
    AxiosError<LLMError>,
    NLPToTemplateRequest
  >({
    mutationFn: async (data) => {
      return await nlpToTemplate(data);
    },
    onError: (error) => {
      console.error("❌ Failed to parse NLP input:", error);
    },
  });
};
