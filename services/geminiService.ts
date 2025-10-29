
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { errorHandler, StructuredError } from './errorHandler';
import { KNOWLEDGE_BASE_MARKDOWN, LINKEDIN_REPLY_STYLE_GUIDE } from '../constants';
import type { QualityScore, QualityMetrics, Reference, StatusCallback } from "../types";

// Per user request, the API key is now hardcoded to ensure immediate functionality.
const ai = new GoogleGenAI({ apiKey: 'AQ.Ab8RN6JibdLfESmQB7ZGrEMivxjQoXMXE1dAfalg_XqJfAAUIQ' });

const callAI = async (
    modelName: string, 
    systemInstruction: string,
    prompt: string, 
    tools: any[] = [],
    isJson: boolean = false
): Promise<GenerateContentResponse> => {
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                systemInstruction,
                tools,
                responseMimeType: isJson ? "application/json" : "text/plain",
            },
        });
        if (isJson) {
            const text = response.text.trim();
            if (!text.startsWith('{') && !text.startsWith('[')) {
                 throw new Error("AI response is not valid JSON.");
            }
        }
        return response;
    } catch (error) {
        throw error;
    }
};

const extractKeywords = async (postContent: string): Promise<string[]> => {
    const systemInstruction = `You are a research librarian. Your task is to extract the 3-5 most important scientific or technical keywords from a LinkedIn post that can be used as search queries in academic databases like PubMed or Google Scholar.`;
    const prompt = `Post: "${postContent}"\n\nKeywords:`;
    const response = await callAI("gemini-2.5-flash", systemInstruction, prompt);
    return response.text.split(',').map(k => k.trim());
};

const draftWithLiterature = async (postContent: string, replyMode: string, keywords: string[]): Promise<GenerateContentResponse> => {
    const systemInstruction = `You are an AI embodiment of "Abraham Trueba," a scientific expert. Your task is to draft an expert-level comment on a LinkedIn post.
    1.  First, use Google Search with the provided keywords to find 2-3 high-quality academic sources (peer-reviewed papers, pre-prints from bioRxiv, etc.).
    2.  Synthesize the information from these sources to form a deep, mechanistic, or strategic insight.
    3.  Write a draft reply strictly following the "LinkedIn Reply Style Guide".
    4.  The reply MUST include superscript citations, e.g., "This is a key finding¹.".
    5.  After the reply, you MUST provide a structured JSON object containing the full reference for each source used. The JSON must be enclosed in \`\`\`json ... \`\`\` tags.
    
    The JSON object should be an array of objects, each with the following keys: "marker", "title", "authors", "year", "journal", "url".`;

    const prompt = `
    KNOWLEDGE BASE & STYLE GUIDE:
    ---
    ${KNOWLEDGE_BASE_MARKDOWN}
    ${LINKEDIN_REPLY_STYLE_GUIDE}
    ---
    POST TO ANALYZE:
    ---
    "${postContent}"
    ---
    REPLY MODE: ${replyMode}
    SEARCH KEYWORDS: ${keywords.join(', ')}
    ---
    Draft your reply and then provide the JSON reference list.
    `;

    return callAI("gemini-2.5-flash", systemInstruction, prompt, [{ googleSearch: {} }]);
};

const validateAndFinalize = async (postContent: string, draft: string, references: Reference[]): Promise<string> => {
    const systemInstruction = `You are a ruthless academic peer reviewer and editor. Your task is to validate and refine a draft reply.
    1.  **Validate Claims:** Meticulously check if the claims in the draft are plausibly supported by the provided reference titles and abstracts. REJECT AND REMOVE any claim or citation that seems unsupported or "hallucinated".
    2.  **Ensure Quality:** The final output must be of the highest quality, adhering perfectly to the "Abraham Trueba" persona style guide.
    3.  **Finalize:** Produce only the final, clean, edited reply text. Do not include the reference list or any other commentary.`;

    const prompt = `
    STYLE GUIDE:
    ---
    ${LINKEDIN_REPLY_STYLE_GUIDE}
    ---
    ORIGINAL POST:
    ---
    "${postContent}"
    ---
    DRAFT REPLY FOR REVIEW:
    ---
    "${draft}"
    ---
    REFERENCES TO VALIDATE AGAINST:
    ---
    ${JSON.stringify(references, null, 2)}
    ---
    Your final, validated, and refined reply:`;

    const response = await callAI("gemini-2.5-flash", systemInstruction, prompt);
    return response.text;
};

const parseDraftResponse = (responseText: string): { draft: string; references: Reference[] } => {
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = responseText.match(jsonBlockRegex);

    if (match && match[1]) {
        try {
            const references = JSON.parse(match[1]);
            const draft = responseText.replace(jsonBlockRegex, '').trim();
            return { draft, references };
        } catch (e) {
            console.error("Failed to parse JSON from draft response", e);
            // Fallback if JSON is malformed
            return { draft: responseText.replace(jsonBlockRegex, '').trim(), references: [] };
        }
    }
    // If no JSON block, assume the whole text is the draft
    return { draft: responseText.trim(), references: [] };
};

export const generateLinkedInReply = async (postContent: string, replyMode: 'balanced' | 'technical' | 'collaborative', statusCallback: StatusCallback): Promise<{ reply: string; references: Reference[] }> => {
    if (!postContent.trim()) {
        throw new Error("Post content cannot be empty.");
    }

    try {
        statusCallback("Analyzing post & formulating search strategy...");
        const keywords = await extractKeywords(postContent);

        statusCallback("Searching academic literature & drafting reply...");
        const draftResponse = await draftWithLiterature(postContent, replyMode, keywords);
        
        if (!draftResponse.text.trim()) {
            throw new Error("The AI returned an empty response during the drafting stage.");
        }
        
        const { draft: initialDraft, references: initialReferences } = parseDraftResponse(draftResponse.text);

        if (initialReferences.length === 0) {
            // If no sources were found, we can't validate, so just return the draft
             return { reply: initialDraft, references: initialReferences };
        }
        
        statusCallback("Cross-referencing claims & validating citations...");
        const finalReply = await validateAndFinalize(postContent, initialDraft, initialReferences);

        statusCallback("Finalizing response...");

        // Ensure references are correctly numbered based on their appearance in the final reply
        const finalReferences = initialReferences.filter(ref => finalReply.includes(`[${ref.marker}]`));

        return { reply: finalReply, references: finalReferences };

    } catch (error) {
        const context = {
            operation: 'generateLinkedInReply',
            timestamp: Date.now(),
            userAction: 'generateReply',
        };
        const handledError = errorHandler.handleError(error, context);
        throw new StructuredError(handledError);
    }
};

export const evaluateReplyQuality = async (postContent: string, generatedReply: string, references: Reference[]): Promise<QualityScore> => {
    const systemInstruction = `You are a Quality Assurance expert. Analyze the generated LinkedIn reply based on the original post and a set of quality metrics. Provide a score from 0 to 100 for each metric and return a JSON object.`;
    
    const prompt = `
    Original Post:
    ---
    "${postContent}"
    ---
    Generated Reply (citations are in [1] format):
    ---
    "${generatedReply}"
    ---
    Cited References:
    ---
    ${references.length > 0 ? JSON.stringify(references, null, 2) : "None"}
    ---

    Evaluate the following metrics:
    - scientificAccuracy: How well does the reply use scientific concepts correctly?
    - citationRelevance: How relevant are the cited papers to the point being made? Score high for recent, high-impact citations. A score of 0 if no citations are present.
    - technicalDepth: How deep is the technical insight? Score high for discussing specific mechanisms, quantitative data, or nuanced comparisons.
    - noveltyOfInsight: Does the reply introduce a new, interesting angle that adds significant value?
    - professionalTone: Does the reply maintain a collaborative, expert-level tone suitable for LinkedIn?
    - sourceRelevance: Are the sources high-quality (journals, pre-prints)? Score high if they support the insight. A score of 0 if no sources are present.
    - mechanisticClarity: How well does the reply explain the 'how' or 'why' behind a scientific point?
    - strategicInsight: How well does the reply connect the science to business or investment concepts (e.g., market need, value inflection, de-risking)?
    - communicationClarity: How clear and well-structured is the reply?
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        scientificAccuracy: { type: Type.NUMBER },
                        citationRelevance: { type: Type.NUMBER },
                        technicalDepth: { type: Type.NUMBER },
                        noveltyOfInsight: { type: Type.NUMBER },
                        professionalTone: { type: Type.NUMBER },
                        sourceRelevance: { type: Type.NUMBER },
                        mechanisticClarity: { type: Type.NUMBER },
                        strategicInsight: { type: Type.NUMBER },
                        communicationClarity: { type: Type.NUMBER },
                    },
                     required: ['scientificAccuracy', 'citationRelevance', 'technicalDepth', 'noveltyOfInsight', 'professionalTone', 'sourceRelevance', 'mechanisticClarity', 'strategicInsight', 'communicationClarity']
                },
            }
        });
        
        const jsonText = response.text.trim();
        const metrics = JSON.parse(jsonText) as QualityMetrics;
        
        const overall = Object.values(metrics).reduce((a, b) => a + b, 0) / Object.keys(metrics).length;

        return {
          overall,
          metrics,
        };

    } catch (error) {
        console.error("Error evaluating reply quality:", error);
        const defaultMetrics: QualityMetrics = {
            scientificAccuracy: 0,
            citationRelevance: 0,
            technicalDepth: 0,
            noveltyOfInsight: 0,
            professionalTone: 0,
            sourceRelevance: 0,
            mechanisticClarity: 0,
            strategicInsight: 0,
            communicationClarity: 0,
        };
        return {
            overall: 0,
            metrics: defaultMetrics
        };
    }
};
