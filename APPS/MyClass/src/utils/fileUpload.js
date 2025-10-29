import { API_URL } from '../services/api';

/**
 * Upload a file to the server and get back a URL
 * @param {Object} file - File object from DocumentPicker or ImagePicker
 * @param {string} userId - ID of the user uploading the file
 * @returns {Promise<Object>} - { fileUrl, fileName, fileSize }
 */
export const uploadFileToServer = async (file, userId) => {
  try {
    console.log('Starting file upload:', { uri: file.uri, name: file.name, size: file.size });
    console.log('API_URL:', API_URL);

    // Create form data
    const formData = new FormData();
    
    // Extract file info
    const fileName = file.name || file.uri.split('/').pop();
    const fileType = file.mimeType || file.type || 'application/octet-stream';
    
    // Append file to form data
    formData.append('file', {
      uri: file.uri,
      name: fileName,
      type: fileType,
    });
    
    formData.append('user_id', userId);

    console.log('Uploading to server...', API_URL + '/api/upload');

    // Upload to server with longer timeout for large files
    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    console.log('Upload successful:', data);

    // Return the server URL
    return {
      fileUrl: `${API_URL}${data.file_url}`,
      fileName: data.file_name,
      fileSize: data.file_size,
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

/**
 * Get the full URL for a file path
 * @param {string} filePath - Relative file path from server
 * @returns {string} - Full URL
 */
export const getFileUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath; // Already full URL
  if (filePath.startsWith('/uploads/')) return `${API_URL}${filePath}`;
  return filePath;
};
