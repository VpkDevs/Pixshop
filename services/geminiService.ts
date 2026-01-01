/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { AspectRatio, ImageSize } from "../types";

// Helper to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });

const handleApiResponse = (
    response: GenerateContentResponse,
    context: string
): string => {
    if (response.promptFeedback?.blockReason) {
        throw new Error(`Request blocked: ${response.promptFeedback.blockReason}`);
    }

    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const { mimeType, data } = part.inlineData;
                return `data:${mimeType};base64,${data}`;
            }
        }
    }

    throw new Error(`No image generated for ${context}. Model output: ${response.text || 'Unknown error'}`);
};

/** Edit existing image (Gemini 2.5 Flash Image) */
export const generateEditedImage = async (originalImage: File, userPrompt: string, hotspot: { x: number, y: number }): Promise<string> => {
    const ai = getClient();
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `Edit this image at (${hotspot.x}, ${hotspot.y}). ${userPrompt}. Return only the image.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, { text: prompt }] },
    });
    return handleApiResponse(response, 'edit');
};

/** Apply filter (Gemini 2.5 Flash Image) */
export const generateFilteredImage = async (originalImage: File, filterPrompt: string): Promise<string> => {
    const ai = getClient();
    const originalImagePart = await fileToPart(originalImage);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, { text: `Apply filter: ${filterPrompt}. Return only image.` }] },
    });
    return handleApiResponse(response, 'filter');
};

/** Global Adjustment (Gemini 2.5 Flash Image) */
export const generateAdjustedImage = async (originalImage: File, adjustmentPrompt: string): Promise<string> => {
    const ai = getClient();
    const originalImagePart = await fileToPart(originalImage);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, { text: `Adjust image: ${adjustmentPrompt}. Return only image.` }] },
    });
    return handleApiResponse(response, 'adjustment');
};

/** Remove Background (Gemini 2.5 Flash Image) */
export const generateRemovedBackgroundImage = async (originalImage: File): Promise<string> => {
    const ai = getClient();
    const originalImagePart = await fileToPart(originalImage);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, { text: "Remove background. Return only image." }] },
    });
    return handleApiResponse(response, 'background-removal');
};

/** Magic Fill (Gemini 2.5 Flash Image) */
export const generateMagicFillImage = async (originalImage: File, maskImage: File, userPrompt: string): Promise<string> => {
    const ai = getClient();
    const originalImagePart = await fileToPart(originalImage);
    const maskImagePart = await fileToPart(maskImage);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, { text: `Fill masked area: ${userPrompt}.` }, maskImagePart] },
    });
    return handleApiResponse(response, 'magic-fill');
};

/** Generate new image (Gemini 3 Pro Image) */
export const generateNewImage = async (prompt: string, aspectRatio: AspectRatio, imageSize: ImageSize): Promise<string> => {
    const ai = getClient(); 
    
    // Check for API key in a real scenario
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig: { aspectRatio, imageSize }
        }
    });
    return handleApiResponse(response, 'generation');
};

/** Analyze Image */
export const analyzeImage = async (
    image: File, 
    prompt: string, 
    useThinking: boolean = false, 
    useGrounding: boolean = false
): Promise<{ text: string, groundingChunks?: any[] }> => {
    const ai = getClient();
    const imagePart = await fileToPart(image);
    
    let config: any = {};
    let model = 'gemini-3-pro-preview';

    // Model selection logic based on feature requirements
    if (useThinking) {
        config.thinkingConfig = { thinkingBudget: 16000 };
        model = 'gemini-3-pro-preview';
    } else if (useGrounding) {
        // Use 2.5 Flash for grounding if thinking is not required
        model = 'gemini-2.5-flash';
        config.tools = [{ googleSearch: {} }, { googleMaps: {} }];
    } else {
        // Standard analysis
        model = 'gemini-3-flash-preview';
    }

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [imagePart, { text: prompt }] },
        config: config
    });
    
    return {
        text: response.text || "No analysis generated.",
        groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
};

/** Analyze Video (Gemini 3 Pro) */
export const analyzeVideo = async (videoFile: File, prompt: string): Promise<string> => {
    const ai = getClient();
    const videoPart = await fileToPart(videoFile);
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [videoPart, { text: prompt }] }
    });
    return response.text || "No analysis generated.";
};

/** Generate Speech (TTS) */
export const generateSpeech = async (text: string): Promise<string> => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    return base64Audio;
};

/** Generate Video (Veo) */
export const generateVeoVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', image?: File): Promise<string> => {
    const ai = getClient();
    
    let config: any = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
    };
    
    let operation;
    
    if (image) {
        const imagePart = await fileToPart(image);
        operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt || "Animate this image naturally",
            image: {
                imageBytes: imagePart.inlineData.data,
                mimeType: imagePart.inlineData.mimeType
            },
            config
        });
    } else {
        operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config
        });
    }

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation });
    }

    const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) throw new Error("Video generation failed or no URI returned.");

    return `${uri}&key=${process.env.API_KEY}`;
};