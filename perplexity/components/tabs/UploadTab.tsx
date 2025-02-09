// components/tabs/UploadTab.tsx
import { Dispatch, SetStateAction } from 'react';
import { FileData, AnalysisResult } from "@/types/types";
import { processFile } from "@/utils/fileUtils";
import { analyzeFiles } from "@/utils/analysisUtils";
import Card from "@/components/ui/Card";
import ApiToggle from "@/components/upload/ApiToggle";
import FileUploader from "@/components/upload/FileUploader";
import FileList from "@/components/upload/FileList";

interface UploadTabProps {
  files: FileData[];
  setFiles: Dispatch<SetStateAction<FileData[]>>;
  selectedFileIds: string[];
  setSelectedFileIds: Dispatch<SetStateAction<string[]>>;
  useRemoteApi: boolean;
  setUseRemoteApi: Dispatch<SetStateAction<boolean>>;
  setActiveTab: Dispatch<SetStateAction<'upload' | 'analysis'>>;
  setAnalysisResult: Dispatch<SetStateAction<AnalysisResult | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
}

export default function UploadTab({
  files,
  setFiles,
  selectedFileIds,
  setSelectedFileIds,
  useRemoteApi,
  setUseRemoteApi,
  setActiveTab,
  setAnalysisResult,
  setLoading,
  setError
}: UploadTabProps) {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    const newFiles = Array.from(event.target.files);
    
    Promise.all(
      newFiles.map((file) => processFile(file))
    ).then((processedFiles) => {
      setFiles((prevFiles) => [...prevFiles, ...processedFiles.filter(f => f !== null) as FileData[]]);
      setLoading(false);
    }).catch((err) => {
      setError(`Error processing files: ${err.message}`);
      setLoading(false);
    });
  };
  
  const removeFile = (fileId: string) => {
    setFiles(files.filter(file => file.id !== fileId));
    setSelectedFileIds(selectedFileIds.filter(id => id !== fileId));
  };
  
  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds(prevIds => 
      prevIds.includes(fileId)
        ? prevIds.filter(id => id !== fileId)
        : [...prevIds, fileId]
    );
  };
  
  const handleAnalyzeFiles = async () => {
    if (selectedFileIds.length === 0) {
      setError("Please select at least one file to analyze");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const selectedFiles = files.filter(file => 
        selectedFileIds.includes(file.id) && file.isValid
      );
      
      if (selectedFiles.length === 0) {
        throw new Error("No valid files selected");
      }
      
      const result = await analyzeFiles(
        selectedFiles, 
        useRemoteApi,
        () => {
          setError('Failed to connect to Python API. Using fallback method.');
          setUseRemoteApi(false);
        }
      );
      
      setAnalysisResult(result);
      setActiveTab('analysis');
      setLoading(false);
    } catch (err: any) {
      setError(`Error analyzing files: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div>
      <ApiToggle 
        useRemoteApi={useRemoteApi}
        setUseRemoteApi={setUseRemoteApi}
      />
      
      <FileUploader onFileUpload={handleFileUpload} />
      
      {files.length > 0 && (
        <FileList
          files={files}
          selectedFileIds={selectedFileIds}
          toggleFileSelection={toggleFileSelection}
          removeFile={removeFile}
          onAnalyze={handleAnalyzeFiles}
        />
      )}
    </div>
  );
}