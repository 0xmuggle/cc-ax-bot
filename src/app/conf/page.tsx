'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { BotConfig } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const ConfigPage: React.FC = () => {
  const { bots, addBot, updateBot, deleteBot } = useStore();

  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [chatId, setChatId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !apiKey || !chatId) return;

    const botData = { name, apiKey, chatId };

    if (editingId) {
      updateBot({ id: editingId, ...botData });
    } else {
      addBot({ id: uuidv4(), ...botData });
    }
    resetForm();
  };

  const handleEdit = (bot: BotConfig) => {
    setEditingId(bot.id);
    setName(bot.name);
    setApiKey(bot.apiKey);
    setChatId(bot.chatId);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setApiKey('');
    setChatId('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Bot' : 'Add New Bot'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Bot Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">API Key</label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Channel/Chat ID</label>
            <input type="text" value={chatId} onChange={e => setChatId(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div className="flex space-x-2">
            <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">{editingId ? 'Update Bot' : 'Save Bot'}</button>
            {editingId && <button type="button" onClick={resetForm} className="w-full bg-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-400">Cancel</button>}
          </div>
        </form>
      </div>

      <div className="md:col-span-2 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Configured Bots</h3>
        <div className="space-y-3">
          {bots.map(bot => (
            <div key={bot.id} className="p-3 border rounded-md bg-gray-50 flex justify-between items-center">
              <div>
                <p className="font-bold">{bot.name}</p>
                <p className="text-xs text-gray-600">Chat ID: {bot.chatId}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => handleEdit(bot)} className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-2 rounded">Edit</button>
                <button onClick={() => deleteBot(bot.id)} className="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConfigPage;