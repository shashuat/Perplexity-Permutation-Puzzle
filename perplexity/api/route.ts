// app/api/perplexity/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Define the Python API endpoint where your Gemma 2 model is running
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5000/calculate-perplexity';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.text) {
      return NextResponse.json(
        { error: 'Text is required' }, 
        { status: 400 }
      );
    }
    
    // Call the Python API
    const response = await fetch(PYTHON_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: body.text }),
    });
    
    if (!response.ok) {
      throw new Error(`Python API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({ perplexity: data.perplexity });
  } catch (error: any) {
    console.error('Error in perplexity calculation:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to calculate perplexity' }, 
      { status: 500 }
    );
  }
}