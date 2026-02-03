import React, { useEffect, useState } from 'react';
import { decryptData } from '../libs/client-crypto';
import { decryptFile } from '../libs/client-file-crypto';
import { getEncryptedSecret, getEncryptedFile, FileMetadata } from '../libs/api';

interface ViewSecretProps {
  id: string;
  decryptionKey: string;
}

export function ViewSecret({ id, decryptionKey }: ViewSecretProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secretText, setSecretText] = useState<string | null>(null);
  const [fileData, setFileData] = useState<{ blob: Blob; filename: string } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Try text secret first
        const secretEncrypted = await getEncryptedSecret(id);
        
        if (secretEncrypted) {
          const decrypted = await decryptData(secretEncrypted, decryptionKey);
          if (mounted) setSecretText(decrypted);
          return;
        }

        // Try file secret
        const fileResponse = await getEncryptedFile(id);
        if (fileResponse) {
          const { metadata, encryptedData } = fileResponse;
          
          // Convert Base64 IV to Uint8Array
          const ivString = atob(metadata.iv);
          const iv = new Uint8Array(ivString.length);
          for (let i = 0; i < ivString.length; i++) {
            iv[i] = ivString.charCodeAt(i);
          }

          const decryptedBlob = await decryptFile(iv, encryptedData, decryptionKey, metadata.contentType);
          
          if (mounted) {
            setFileData({
              blob: decryptedBlob,
              filename: metadata.originalFilename
            });
          }
          return;
        }

        throw new Error("Secret not found or expired.");

      } catch (err: any) {
        console.error(err);
        if (mounted) setError(err.message || "Failed to decrypt secret. Invalid key or expired?");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => { mounted = false; };
  }, [id, decryptionKey]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-neutral-800 rounded-lg shadow-xl text-center">
        <h2 className="text-xl text-red-500 font-bold mb-2">Error</h2>
        <p className="text-gray-300">{error}</p>
        <button 
          onClick={() => window.location.hash = ''}
          className="mt-6 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-neutral-800 rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-white">Decrypted Secret</h1>
      
      {secretText && (
        <div className="space-y-4">
          <label className="text-gray-400 text-sm">Message Content:</label>
          <div className="bg-neutral-900 p-4 rounded border border-neutral-700 whitespace-pre-wrap font-mono text-white">
            {secretText}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(secretText);
              alert("Copied!");
            }}
            className="w-full py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded"
          >
            Copy Text
          </button>
        </div>
      )}

      {fileData && (
        <div className="space-y-6 text-center py-8">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl text-white font-medium">{fileData.filename}</h3>
          <p className="text-gray-400">Ready for download</p>
          
          <a
            href={URL.createObjectURL(fileData.blob)}
            download={fileData.filename}
            className="inline-block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors text-center"
          >
            Download File
          </a>
        </div>
      )}
       <div className="mt-8 pt-6 border-t border-neutral-700 text-center">
          <p className="text-gray-400 mb-4 text-sm">
             Once viewed, make sure to save it. The link will expire based on the set duration.
          </p>
          <button 
            onClick={() => window.location.hash = ''}
            className="px-4 py-2 text-blue-400 hover:text-blue-300"
          >
            &larr; Create New Secret
          </button>
       </div>
    </div>
  );
}
