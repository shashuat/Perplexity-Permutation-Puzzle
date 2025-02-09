// utils/fileUtils.ts
import Papa from "papaparse";
import { FileData } from "@/types/types";

export const processFile = (file: File): Promise<FileData | null> => {
  return new Promise((resolve, reject) => {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      if (!content) {
        reject(new Error(`Failed to read file: ${file.name}`));
        return;
      }
      
      try {
        Papa.parse(content, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            const isValid = results.meta.fields?.includes('id') && 
                            results.meta.fields?.includes('text');
            
            resolve({
              id: fileId,
              name: file.name,
              content,
              data: results.data,
              fields: results.meta.fields || [],
              isValid
            });
          },
          error: (error) => {
            reject(new Error(`Error parsing ${file.name}: ${error.message}`));
          }
        });
      } catch (err) {
        reject(err);
      }
    };
    
    reader.onerror = () => {
      reject(new Error(`Error reading file: ${file.name}`));
    };
    
    reader.readAsText(file);
  });
};