import { UserMode, CognifyResponse } from "../types";

export const generateCognifyResponse = async (
  currentInput: string,
  mode: UserMode,
  history: { role: string; text: string }[] = [],
  attachment?: { base64: string; mimeType: string }
): Promise<CognifyResponse> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentInput,
        mode,
        history,
        attachment,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }

    return await response.json() as CognifyResponse;
  } catch (error) {
    console.error("Cognify AI Fetch Error:", error);
    throw error;
  }
};
