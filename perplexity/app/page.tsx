"use client";

import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import PageFooter from "@/components/layout/PageFooter";
import UploadTab from "@/components/tabs/UploadTab";
import AnalysisTab from "@/components/tabs/AnalysisTab";
import ErrorAlert from "@/components/ui/ErrorAlert";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { AnalysisResult, FileData } from "@/types/types";

export default function Home() {
  // State management
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'analysis'>('upload');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [useRemoteApi, setUseRemoteApi] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <PageHeader />
      
      <main className="container mx-auto p-4 mb-12">
        {/* Navigation tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-4 mr-2 ${
              activeTab === 'upload' 
                ? 'border-b-2 border-blue-500 font-medium' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Upload Files
          </button>
          <button 
            onClick={() => setActiveTab('analysis')}
            className={`py-2 px-4 mr-2 ${
              activeTab === 'analysis' 
                ? 'border-b-2 border-blue-500 font-medium' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
            disabled={!analysisResult}
          >
            Analysis
          </button>
        </div>
        
        {/* Error display */}
        {error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}
        
        {/* Loading indicator */}
        {loading && <LoadingSpinner />}
        
        {/* Content based on active tab */}
        {!loading && (
          <>
            {activeTab === 'upload' && (
              <UploadTab 
                files={files}
                setFiles={setFiles}
                selectedFileIds={selectedFileIds}
                setSelectedFileIds={setSelectedFileIds}
                useRemoteApi={useRemoteApi}
                setUseRemoteApi={setUseRemoteApi}
                setActiveTab={setActiveTab}
                setAnalysisResult={setAnalysisResult}
                setLoading={setLoading}
                setError={setError}
              />
            )}
            
            {activeTab === 'analysis' && analysisResult && (
              <AnalysisTab analysisResult={analysisResult} />
            )}
          </>
        )}
      </main>
      
      <PageFooter />
    </div>
  );
}