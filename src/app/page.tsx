"use client";

import React, { useState, useTransition } from 'react';
import { runAgent } from './actions'; // Import the server action

export default function AgentRunnerPage() {
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null); // Clear previous results
    setError(null); // Clear previous errors

    if (!input.trim()) {
      setError('Input cannot be empty.');
      return;
    }

    // Use startTransition to prevent blocking the UI during the server action call.
    startTransition(async () => {
      const response = await runAgent({ input });

      if (response.success) {
        setResult(response.data.result);
      } else {
        setError(response.error);
      }
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center">CrossNode Agent Runner</h1>
      <form onSubmit={handleSubmit} className="mb-6 p-6 border rounded-lg shadow-md bg-white">
        <div className="mb-4">
          <label htmlFor="agentInput" className="block text-lg font-semibold mb-2 text-gray-700">
            Enter Input for Agent:
          </label>
          <textarea
            id="agentInput"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm text-base"
            placeholder="e.g., Analyze this domain..."
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          {isSubmitting ? 'Running Agent...' : 'Run Agent'}
        </button>
      </form>

      {error && (
        <div className="p-4 border border-red-400 rounded-md bg-red-100 text-red-800 mb-4 shadow-sm">
          <h3 className="font-semibold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="p-4 border border-green-400 rounded-md bg-green-100 text-green-800 shadow-md">
          <h3 className="font-semibold">Agent Result:</h3>
          <p className="whitespace-pre-wrap break-words">{result}</p>
        </div>
      )}

      {!error && !result && !isSubmitting && (
        <div className="text-center text-gray-500">
          <p>Submit input to see the agent's result.</p>
        </div>
      )}
    </div>
  );
}
