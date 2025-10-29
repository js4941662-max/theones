import { GoogleGenAI } from "@google/genai";
import { errorHandler, StructuredError } from './errorHandler';
import { LINKEDIN_REPLY_MASTER_PROMPT, LINKEDIN_REPLY_SCHEMA } from '../constants';
import { fallbackData } from '../fallbackData';
import type { LinkedInReplyOutput, StatusCallback } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const proModel = "gemini-2.5-pro-002";
const MAX_RETRIES = 3;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateLinkedInReply = async (originalPost: string, setStatus: StatusCallback): Promise<LinkedInReplyOutput> => {
    let lastError: StructuredError | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const prompt = `${LINKEDIN_REPLY_MASTER_PROMPT}

Here is the LinkedIn post I need you to analyze and create a reply for:

---
${originalPost}
---

Please provide your complete analysis, reply, quality scores, and alternative versions in the JSON format specified.`;

            if (attempt === 1) {
                setStatus('Executing analysis phase...');
                await delay(400);
                setStatus('Assessing content, author, and engagement...');
                await delay(500);
                setStatus('Formulating strategic approach...');
                await delay(400);
                setStatus('Engaging Gemini 2.5 Pro for reply construction...');
            }
            
            const response = await ai.models.generateContent({
                model: proModel,
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    temperature: 0.8,
                    topP: 0.95,
                    topK: 40,
                    responseMimeType: "application/json",
                    responseSchema: LINKEDIN_REPLY_SCHEMA,
                }
            });

            setStatus('Finalizing response...');
            const responseText = response.text.trim();
            if (!responseText) {
                throw new Error('AI_CONTENT_FAILURE: The AI returned an empty response.');
            }

            return JSON.parse(responseText) as LinkedInReplyOutput;

        } catch (err) {
            const errorResponse = err instanceof StructuredError 
                ? err.response 
                : errorHandler.handleError(err, { operation: `generateLinkedInReply-${proModel}`, timestamp: Date.now() });
            
            lastError = new StructuredError(errorResponse);

            // Intercept critical, non-retryable quota errors and switch to demonstration mode.
            if (errorResponse.severity === 'critical' && !errorResponse.canRetry && errorResponse.message.toLowerCase().includes('quota')) {
                console.warn('API quota exceeded. Switching to Demonstration Mode.');
                return fallbackData;
            }

            if (errorResponse.canRetry && attempt < MAX_RETRIES) {
                const retryDelay = errorResponse.retryDelay || 2000;
                setStatus(`Transient error detected. Retrying in ${retryDelay / 1000}s... (Attempt ${attempt}/${MAX_RETRIES})`);
                await delay(retryDelay);
                setStatus('Re-engaging Gemini 2.5 Pro...');
            } else {
                throw lastError; // Non-retryable error or max retries reached
            }
        }
    }
    // This line should not be reachable, but is a fallback.
    throw lastError || new StructuredError(errorHandler.handleError(new Error("Unknown failure after all retries."), { operation: 'generateLinkedInReply-fallback', timestamp: Date.now()}));
};