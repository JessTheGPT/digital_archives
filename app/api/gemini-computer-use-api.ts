// app/api/computer-use/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { prompt, screenshot, action } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    let result;

    switch (action) {
      case 'analyze':
        result = await analyzeScreen(model, prompt, screenshot);
        break;
      case 'plan':
        result = await planActions(model, prompt, screenshot);
        break;
      case 'execute':
        result = await executeAction(model, prompt, screenshot);
        break;
      default:
        result = await analyzeScreen(model, prompt, screenshot);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Computer use error:', error);
    return NextResponse.json(
     { error: 'Computer use failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

async function analyzeScreen(model: any, prompt: string, screenshot: string) {
  const analysisPrompt = `
    Analyze this screenshot and describe what you see. Focus on:
    1. UI elements (buttons, inputs, menus)
    2. Current application/website
    3. Clickable areas
    4. Text content
    5. Overall layout

    User request: ${prompt}

    Provide a detailed analysis and suggest next steps.
  `;

  const imagePart = {
    inlineData: {
      data: screenshot.split(',')[1], // Remove data:image/png;base64, prefix
      mimeType: 'image/png'
    }
  };

  const result = await model.generateContent([analysisPrompt, imagePart]);
  const response = await result.response;
  
  return {
    type: 'analysis',
    content: response.text(),
    confidence: 0.9,
    timestamp: new Date().toISOString()
  };
}

async function planActions(model: any, prompt: string, screenshot: string) {
  const planPrompt = `
    Based on this screenshot and the user's request: "${prompt}"
    
    Create a step-by-step action plan. For each step, specify:
    1. Action type (click, type, scroll, wait)
    2. Target element description
    3. Coordinates (if clicking)
    4. Text to type (if typing)
    5. Confidence level (0-1)

    Format as JSON array of actions.
  `;

  const imagePart = {
    inlineData: {
      data: screenshot.split(',')[1],
      mimeType: 'image/png'
    }
  };

  const result = await model.generateContent([planPrompt, imagePart]);
  const response = await result.response;
  
  try {
    const actions = JSON.parse(response.text());
    return {
      type: 'plan',
      actions: actions,
      confidence: 0.85,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return {
      type: 'plan',
      actions: [
        {
          type: 'analysis',
          description: response.text(),
          confidence: 0.7
        }
      ],
      confidence: 0.7,
      timestamp: new Date().toISOString()
    };
  }
}

async function executeAction(model: any, prompt: string, screenshot: string) {
  // This would integrate with actual automation libraries
  // For now, we'll return execution steps
  const executePrompt = `
    Given this screenshot and the request: "${prompt}"
    
    Provide specific execution instructions including:
    1. Exact coordinates for clicks
    2. Keyboard shortcuts to use
    3. Text to input
    4. Sequence of actions
    
    Be very specific and actionable.
  `;

  const imagePart = {
    inlineData: {
      data: screenshot.split(',')[1],
      mimeType: 'image/png'
    }
  };

  const result = await model.generateContent([executePrompt, imagePart]);
  const response = await result.response;
  
  return {
    type: 'execution',
    instructions: response.text(),
    confidence: 0.8,
    timestamp: new Date().toISOString()
  };
}
