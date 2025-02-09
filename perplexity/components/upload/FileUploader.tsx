// components/upload/FileUploader.tsx
import Card from "@/components/ui/Card";

interface FileUploaderProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function FileUploader({ onFileUpload }: FileUploaderProps) {
  return (
    <Card title="Upload Submission Files">
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Upload CSV files containing submission data with "id" and "text" columns.
      </p>
      
      <label className="block w-full border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center rounded-md cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition">
        <input
          type="file"
          multiple
          onChange={onFileUpload}
          className="hidden"
          accept=".csv"
        />
        <span className="text-gray-500 dark:text-gray-400">
          Drag & drop CSV files here or click to browse
        </span>
      </label>
    </Card>
  );
}