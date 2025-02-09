// components/upload/FileList.tsx
import { FileData } from "@/types/types";
import Card from "@/components/ui/Card";

interface FileListProps {
  files: FileData[];
  selectedFileIds: string[];
  toggleFileSelection: (fileId: string) => void;
  removeFile: (fileId: string) => void;
  onAnalyze: () => void;
}

export default function FileList({
  files,
  selectedFileIds,
  toggleFileSelection,
  removeFile,
  onAnalyze
}: FileListProps) {
  return (
    <Card title="Uploaded Files">
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {files.map((file) => (
          <li key={file.id} className="py-3 flex justify-between items-center">
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`file-${file.id}`}
                className="mr-3"
                checked={selectedFileIds.includes(file.id)}
                onChange={() => toggleFileSelection(file.id)}
                disabled={!file.isValid}
              />
              <label htmlFor={`file-${file.id}`} className={`${!file.isValid ? 'text-gray-400 dark:text-gray-500' : ''}`}>
                {file.name}
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  ({file.data.length} rows)
                </span>
              </label>
            </div>
            
            <div className="flex items-center">
              <span className={`text-xs px-2 py-1 rounded-full mr-3 ${
                file.isValid 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {file.isValid ? 'Valid' : 'Invalid Format'}
              </span>
              
              <button
                onClick={() => removeFile(file.id)}
                className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      
      <div className="mt-6 flex justify-end">
        <button
          onClick={onAnalyze}
          disabled={selectedFileIds.length === 0}
          className={`px-4 py-2 rounded-md ${
            selectedFileIds.length === 0
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
          }`}
        >
          Analyze Selected Files
        </button>
      </div>
    </Card>
  );
}