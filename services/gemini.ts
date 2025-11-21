import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Block, BlockMap } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_FAST = "gemini-2.5-flash";

const mapToBlockArray = (map: BlockMap): Block[] => {
  const blocks: Block[] = [];
  map.forEach((color, key) => {
    const [x, y, z] = key.split(',').map(Number);
    blocks.push({ x, y, z, color, id: key });
  });
  return blocks;
};

export const analyzeSculpture = async (blocks: BlockMap) => {
  if (!apiKey) throw new Error("API Key missing");
  
  const blockList = mapToBlockArray(blocks);
  const blockCount = blockList.length;
  const colors = [...new Set(blockList.map(b => b.color))];

  const prompt = `
    I have built a 3D voxel sculpture with ${blockCount} blocks.
    The colors used are: ${colors.join(', ')}.
    Here is the coordinate data (x, y, z, color) for a few representative blocks (or all if small):
    ${JSON.stringify(blockList.slice(0, 50))}... (truncated if too long).

    Please analyze this sculpture.
    1. Give it a creative, artistic title.
    2. Describe what it looks like abstractly or figuratively.
    3. Identify its architectural style (e.g., Brutalist, Minimalist, Chaos).
    4. Rate its "structural integrity" from 0 to 100 based on how connected it feels (hypothetically).
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      style: { type: Type.STRING },
      structuralIntegrity: { type: Type.NUMBER },
    },
    required: ["title", "description", "style", "structuralIntegrity"],
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateRemix = async (currentBlocks: BlockMap) => {
  if (!apiKey) throw new Error("API Key missing");

  const blockList = mapToBlockArray(currentBlocks);
  const totalBlocks = blockList.length;
  
  // Count colors
  const colorCounts: Record<string, number> = {};
  blockList.forEach(b => {
    colorCounts[b.color] = (colorCounts[b.color] || 0) + 1;
  });

  const prompt = `
    I have a set of voxel blocks:
    ${JSON.stringify(colorCounts)}
    Total blocks: ${totalBlocks}.

    I want you to design a completely NEW sculpture using EXACTLY this inventory of blocks.
    The structure should be coherent and interesting.
    
    Return the new coordinates. The coordinates must be integers, preferably centered around 0,0,0 or within a 10x10x10 range.
    Ensure no two blocks overlap.
    
    Output format:
    {
      "name": "Name of new sculpture",
      "description": "Short instruction on what this represents",
      "blocks": [ { "x": int, "y": int, "z": int, "color": string } ]
    }
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      description: { type: Type.STRING },
      blocks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            x: { type: Type.INTEGER },
            y: { type: Type.INTEGER },
            z: { type: Type.INTEGER },
            color: { type: Type.STRING },
          },
          required: ["x", "y", "z", "color"]
        }
      }
    },
    required: ["name", "description", "blocks"],
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Remix Error:", error);
    throw error;
  }
};
