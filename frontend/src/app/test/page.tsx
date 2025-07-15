'use client';

import { useState } from 'react';

export default function TestPage() {
  const [result, setResult] = useState('');

  const testRegister = async () => {
    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          password: 'password123'
        })
      });
      
      const data = await response.json();
      setResult('REGISTER: ' + JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Register Error: ${error}`);
    }
  };

  const testLogin = async () => {
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123'
        })
      });
      
      const data = await response.json();
      setResult('LOGIN: ' + JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Login Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">API Test</h1>
        
        <div className="space-x-4 mb-4">
          <button 
            onClick={testRegister}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Test Register
          </button>
          
          <button 
            onClick={testLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Test Login
          </button>
        </div>
        
        <pre className="bg-gray-800 text-white p-4 rounded overflow-auto">
          {result}
        </pre>
      </div>
    </div>
  );
}