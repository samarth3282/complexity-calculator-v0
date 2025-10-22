/**
 * Test script to verify Gemini API integration
 * Run with: node --require dotenv/config test-gemini-api.mjs
 */

const testCode = `
#include <iostream>
#include <vector>

void bubbleSort(std::vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n-1; i++) {
        for (int j = 0; j < n-i-1; j++) {
            if (arr[j] > arr[j+1]) {
                std::swap(arr[j], arr[j+1]);
            }
        }
    }
}
`;

async function testGeminiAPI() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in environment variables');
        console.log('\n📝 Setup instructions:');
        console.log('1. Get API key from: https://makersuite.google.com/app/apikey');
        console.log('2. Add to .env.local: GEMINI_API_KEY=your_key_here');
        console.log('3. Restart the server\n');
        return;
    }

    console.log('✅ API key found');
    console.log('🧪 Testing Gemini API...\n');

    const prompt = `Analyze the computational complexity of this C++ code. Provide ONLY a JSON response with this exact structure:
{
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "confidence": 0.0-1.0,
  "explanation": "brief explanation",
  "cases": {
    "best": "O(...)",
    "average": "O(...)",
    "worst": "O(...)"
  }
}

Code to analyze:
\`\`\`cpp
${testCode}
\`\`\`

Rules:
- Use standard Big-O notation (e.g., O(1), O(n), O(log n), O(n²), O(n log n))
- Be precise and accurate
- Return ONLY valid JSON, no markdown formatting`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 1024,
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('❌ API request failed:', response.status);
            console.error(error);
            return;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error('❌ No response from API');
            return;
        }

        console.log('✅ API Response received\n');
        console.log('📊 Raw Response:');
        console.log(text);
        console.log('\n');

        // Extract JSON
        let jsonText = text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        const result = JSON.parse(jsonText);

        console.log('✅ Parsed Result:');
        console.log(JSON.stringify(result, null, 2));
        console.log('\n');

        console.log('🎯 Expected for Bubble Sort:');
        console.log('  Time: O(n²)');
        console.log('  Space: O(1)');
        console.log('\n');

        if (result.timeComplexity.includes('n²') || result.timeComplexity.includes('n^2')) {
            console.log('✅ Correct complexity detected!');
        } else {
            console.log('⚠️ Unexpected complexity:', result.timeComplexity);
        }

        console.log('\n✅ Integration test PASSED - Your setup is ready for demo!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('\nPlease check:');
        console.error('1. API key is valid');
        console.error('2. Internet connection is working');
        console.error('3. Gemini API is accessible');
    }
}

testGeminiAPI();
