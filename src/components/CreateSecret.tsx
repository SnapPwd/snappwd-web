import React, { useState } from 'react';
import { generateEncryptionKey, encryptData, base58Encode } from '../libs/client-crypto';
import { encryptFile } from '../libs/client-file-crypto';
import { storeEncryptedSecret, storeEncryptedFile, FileMetadata } from '../libs/api';

const EXPIRATION_OPTIONS = [
  { label: '1 Hour', value: 3600 },
  { label: '1 Day', value: 86400 },
  { label: '1 Week', value: 604800 },
];

export function CreateSecret() {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [expiration, setExpiration] = useState(86400);
  const [loading, setLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCreatedLink(null);

    try {
      const key = generateEncryptionKey();
      let id = '';

      if (activeTab === 'text') {
        if (!text) throw new Error("Please enter some text");
        const encrypted = await encryptData(text, key);
        id = await storeEncryptedSecret(encrypted, expiration);
      } else {
        if (!file) throw new Error("Please select a file");
        const { iv, encryptedData } = await encryptFile(file, key);
        // IV needs to be base64 for the metadata
        // Wait, metadata iv is string? Yes, let's use base64
        // The API expects iv as string in metadata. client-crypto uses base58 for keys but IVs are usually raw bytes. 
        // Let's check api.ts interface. "iv: string; // Base64 encoded IV".
        
        // Helper to convert Uint8Array to Base64
        const ivBase64 = btoa(String.fromCharCode(...iv));
        
        const metadata: FileMetadata = {
          originalFilename: file.name,
          contentType: file.type,
          iv: ivBase64
        };
        
        id = await storeEncryptedFile(metadata, encryptedData, expiration);
      }

      // Construct link: base/#id_key
      const link = `${window.location.origin}/#${id}_${key}`;
      setCreatedLink(link);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (createdLink) {
      navigator.clipboard.writeText(createdLink);
      alert("Copied to clipboard!");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-neutral-800 rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-white">SnapPwd Self-Hosted</h1>
      
      {!createdLink ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-neutral-700">
            <button
              type="button"
              className={`flex-1 py-2 text-center ${activeTab === 'text' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('text')}
            >
              Text
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-center ${activeTab === 'file' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('file')}
            >
              File
            </button>
          </div>

          {/* Input Area */}
          <div className="min-h-[200px]">
            {activeTab === 'text' ? (
              <textarea
                className="w-full h-48 p-4 bg-neutral-900 text-white border border-neutral-700 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter your secret message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-neutral-700 rounded hover:bg-neutral-900 transition-colors">
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer text-center">
                  <span className="text-4xl block mb-2">📄</span>
                  <span className="text-blue-400 hover:underline">{file ? file.name : "Choose a file to encrypt"}</span>
                </label>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="flex items-center space-x-4">
            <label className="text-gray-300">Expires in:</label>
            <select
              value={expiration}
              onChange={(e) => setExpiration(Number(e.target.value))}
              className="bg-neutral-900 text-white border border-neutral-700 rounded px-3 py-2"
            >
              {EXPIRATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {error && <div className="text-red-500 bg-red-900/20 p-3 rounded">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Encrypting...' : 'Create Secret Link'}
          </button>
        </form>
      ) : (
        <div className="space-y-6 text-center">
          <div className="bg-green-900/20 text-green-400 p-4 rounded mb-4">
            Secret created successfully!
          </div>
          <div className="bg-neutral-900 p-4 rounded break-all border border-neutral-700 font-mono text-sm">
            {createdLink}
          </div>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={copyToClipboard}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Copy Link
            </button>
            <button
              onClick={() => { setCreatedLink(null); setText(''); setFile(null); }}
              className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded"
            >
              Create Another
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-4">
            This link contains the decryption key. Without it, the secret cannot be recovered.
          </p>
        </div>
      )}
    </div>
  );
}
