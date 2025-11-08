import { GoogleGenAI, Type, Modality } from "@google/genai";
// FIX: Corrected import path for types.
import { DetailedTranslationResult } from './types';

const wordSchema = {
  type: Type.OBJECT,
  properties: {
    pronunciation: {
      type: Type.STRING,
      description: "The phonetic pronunciation of the original source word."
    },
    meanings: {
      type: Type.ARRAY,
      description: "A list of the top 3-5 most common meanings, grouped by their part of speech.",
      items: {
        type: Type.OBJECT,
        properties: {
          partOfSpeech: {
            type: Type.STRING,
            description: "The grammatical part of speech (e.g., Noun, Verb, Adjective)."
          },
          translations: {
            type: Type.ARRAY,
            description: "A list of translated words for this part of speech.",
            items: {
              type: Type.STRING
            }
          }
        },
        required: ["partOfSpeech", "translations"]
      }
    }
  },
  required: ["pronunciation", "meanings"]
};

const phraseSchema = {
    type: Type.OBJECT,
    properties: {
        translation: {
            type: Type.STRING,
            description: "The most common translation of the phrase."
        }
    },
    required: ["translation"]
}

// FIX: Removed validateApiKey as per guidelines to not handle API keys in the UI.

// FIX: Removed apiKey parameter and used process.env.API_KEY for initialization as per guidelines.
export const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<DetailedTranslationResult | null> => {
  if (!text.trim()) {
    return null;
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';
  const isPhrase = text.includes(' ');

  try {
    const prompt = isPhrase
        ? `Translate the ${sourceLang} phrase "${text}" into ${targetLang}. Provide the most common translation. Format the output as a simple JSON object with a single key "translation".`
        : `Translate the ${sourceLang} word "${text}" into ${targetLang}. Provide the phonetic pronunciation of the original word. List the top 3-5 most common meanings, grouped by their part of speech (e.g., Noun, Verb). Format the output strictly as JSON.`;
    
    const schema = isPhrase ? phraseSchema : wordSchema;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    if (isPhrase) {
        return {
            pronunciation: '',
            meanings: [{
                partOfSpeech: 'Cümle',
                translations: [parsedJson.translation]
            }]
        }
    }
    return parsedJson as DetailedTranslationResult;
  } catch (error) {
    console.error("Error translating text or parsing JSON:", error);
    return null;
  }
};

// FIX: Removed apiKey parameter and used process.env.API_KEY for initialization as per guidelines.
export const getTextToSpeech = async (text: string, langCode: string): Promise<string | null> => {
  if (!text.trim()) {
    return null;
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const voiceName = langCode === 'tr' ? 'Kore' : 'Zephyr';

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName }, 
                },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch(error) {
    console.error("Error generating speech:", error);
    return null;
  }
};