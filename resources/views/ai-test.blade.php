<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto p-4 max-w-3xl">
        <div class="bg-white p-6 rounded-lg shadow-md">
            <h1 class="text-2xl font-bold mb-4">OpenRouter API Test</h1>
            
            <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p class="font-medium">API Key: <span class="font-mono">{{ $apiKey }}</span></p>
                <p class="text-sm text-gray-600">Using model: meta-llama/llama-4-scout:free</p>
            </div>

            <div class="mb-4">
                <h2 class="text-lg font-semibold mb-2">Test Direct API Access</h2>
                <button id="testApi" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Test API Connection
                </button>
                <div id="apiResult" class="mt-2 p-3 bg-gray-100 rounded-md hidden">
                    <pre class="whitespace-pre-wrap"></pre>
                </div>
            </div>

            <div class="mb-4">
                <h2 class="text-lg font-semibold mb-2">Test JSON Generation</h2>
                <button id="testJson" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                    Test JSON Generation
                </button>
                <div id="jsonResult" class="mt-2 p-3 bg-gray-100 rounded-md hidden">
                    <pre class="whitespace-pre-wrap"></pre>
                </div>
            </div>
            
            <div class="mb-4">
                <h2 class="text-lg font-semibold mb-2">Advanced Troubleshooting</h2>
                <button id="rawAiTest" class="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
                    View Raw AI Response
                </button>
                <div id="rawResult" class="mt-2 p-3 bg-gray-100 rounded-md hidden">
                    <pre class="whitespace-pre-wrap"></pre>
                </div>
            </div>
            
            <div class="mt-8">
                <h2 class="text-lg font-semibold mb-2">Custom Prompt Test</h2>
                <div class="mb-4">
                    <textarea id="prompt" class="w-full p-2 border border-gray-300 rounded" rows="4" 
                        placeholder="Enter a prompt for task creation, e.g., 'Create a website project with frontend, backend, and documentation tasks'"></textarea>
                </div>
                <button id="submitPrompt" class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
                    Submit Prompt
                </button>
                <div id="promptResult" class="mt-2 p-3 bg-gray-100 rounded-md hidden">
                    <pre class="whitespace-pre-wrap"></pre>
                </div>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('testApi').addEventListener('click', async () => {
            const result = document.querySelector('#apiResult pre');
            const resultDiv = document.getElementById('apiResult');
            
            resultDiv.classList.remove('hidden');
            result.textContent = 'Testing API connection...';
            
            try {
                const response = await fetch('/api/your_generic_secreton');
                const data = await response.json();
                result.textContent = JSON.stringify(data, null, 2);
                resultDiv.className = 'mt-2 p-3 rounded-md ' + 
                    (data.success ? 'bg-green-100' : 'bg-red-100');
            } catch (error) {
                result.textContent = 'Error: ' + error.message;
                resultDiv.className = 'mt-2 p-3 bg-red-100 rounded-md';
            }
        });
        
        document.getElementById('testJson').addEventListener('click', async () => {
            const result = document.querySelector('#jsonResult pre');
            const resultDiv = document.getElementById('jsonResult');
            
            resultDiv.classList.remove('hidden');
            result.textContent = 'Testing JSON generation...';
            
            try {
                const response = await fetch('/debug/ai-service-test');
                const data = await response.json();
                result.textContent = JSON.stringify(data, null, 2);
                resultDiv.className = 'mt-2 p-3 rounded-md ' + 
                    (data.error ? 'bg-red-100' : 'bg-green-100');
            } catch (error) {
                result.textContent = 'Error: ' + error.message;
                resultDiv.className = 'mt-2 p-3 bg-red-100 rounded-md';
            }
        });
        
        document.getElementById('submitPrompt').addEventListener('click', async () => {
            const prompt = document.getElementById('prompt').value;
            const result = document.querySelector('#promptResult pre');
            const resultDiv = document.getElementById('promptResult');
            
            if (!prompt.trim()) {
                alert('Please enter a prompt');
                return;
            }
            
            resultDiv.classList.remove('hidden');
            result.textContent = 'Processing prompt...';
            
            try {
                const response = await fetch('/api/no-auth/ai/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: prompt,
                        group_id: 1
                    })
                });
                
                const data = await response.json();
                result.textContent = JSON.stringify(data, null, 2);
                resultDiv.className = 'mt-2 p-3 rounded-md ' + 
                    (data.success ? 'bg-green-100' : 'bg-red-100');
            } catch (error) {
                result.textContent = 'Error: ' + error.message;
                resultDiv.className = 'mt-2 p-3 bg-red-100 rounded-md';
            }
        });

        document.getElementById('rawAiTest').addEventListener('click', async () => {
            const result = document.querySelector('#rawResult pre');
            const resultDiv = document.getElementById('rawResult');
            
            resultDiv.classList.remove('hidden');
            result.textContent = 'Getting raw API response...';
            
            try {
                const response = await fetch('/debug/ai-raw-response');
                const data = await response.json();
                result.textContent = JSON.stringify(data, null, 2);
                resultDiv.className = 'mt-2 p-3 rounded-md bg-yellow-50';
            } catch (error) {
                result.textContent = 'Error: ' + error.message;
                resultDiv.className = 'mt-2 p-3 bg-red-100 rounded-md';
            }
        });
    </script>
</body>
</html> 