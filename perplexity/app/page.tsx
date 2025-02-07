"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Papa from "papaparse";
import _ from "lodash";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, Cell 
} from "recharts";

// Types
type FileData = {
  id: string;
  name: string;
  content: string;
  data: any[];
  fields: string[];
  isValid: boolean;
};

type AnalysisResult = {
  fileStats: {
    name: string;
    rowCount: number;
    avgWordCount: number;
    maxWordCount: number;
    minWordCount: number;
  }[];
  comparison: {
    file1Name: string;
    file2Name: string;
    data: {
      id: string | number;
      file1Text: string;
      file2Text: string;
      wordsMatch: boolean;
      textsDifferent: boolean;
    }[];
    differentTexts: number;
    sameWords: number;
  } | null;
  commonIds: number;
  totalUniqueIds: number;
  perplexityScores: {
    name: string;
    avgPerplexity: number;
    scores: {
      id: string | number;
      text: string;
      perplexity: number;
    }[];
    distribution: {
      bucket: number;
      count: number;
    }[];
  }[];
  bestTexts?: {
    id: string | number;
    text: string;
    perplexity: number;
    source: string;
  }[];
};

// API endpoints constants
const API_ENDPOINTS = {
  CALCULATE_PERPLEXITY: "/api/perplexity", // Future endpoint for Python-based perplexity calculation
};

export default function Home() {
  // State management
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'analysis'>('upload');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [useRemoteApi, setUseRemoteApi] = useState<boolean>(false);
  const [showTextDetails, setShowTextDetails] = useState<boolean>(true);

  // File handling functions
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
  
  const processFile = (file: File): Promise<FileData | null> => {
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

  // Perplexity calculation
  const calculatePerplexity = async (text: string): Promise<number> => {
    if (!useRemoteApi) {
      // Dummy perplexity score based on text characteristics
      // In a real application, this would call your Python API
      const wordCount = text.split(' ').length;
      const uniqueWords = new Set(text.toLowerCase().split(' ')).size;
      const entropy = uniqueWords / wordCount;
      
      // Generate a score between 5 and 30, lower is better
      // Formula designed to make more coherent texts get lower scores
      const score = 5 + 25 * (1 - entropy) * Math.random();
      return score;
    }
    
    try {
      const response = await fetch(API_ENDPOINTS.CALCULATE_PERPLEXITY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.perplexity;
    } catch (error) {
      console.error('Error calculating perplexity:', error);
      setError('Failed to calculate perplexity. Using fallback method.');
      setUseRemoteApi(false);
      return calculatePerplexity(text); // Fallback to dummy calculation
    }
  };

  // Analysis functions
  const analyzeFiles = async () => {
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
      
      // Basic file statistics
      const fileStats = selectedFiles.map(file => {
        const textLengths = file.data.map(row => 
          row.text ? row.text.toString().split(' ').length : 0
        );
        
        return {
          name: file.name,
          rowCount: file.data.length,
          avgWordCount: _.mean(textLengths).toFixed(2),
          maxWordCount: _.max(textLengths),
          minWordCount: _.min(textLengths),
        };
      });
      
      // File comparison if multiple files
      let comparison = null;
      if (selectedFiles.length > 1) {
        const file1 = selectedFiles[0];
        const file2 = selectedFiles[1];
        
        const comparisonData = [];
        
        // Find common IDs between the two files
        const file1Ids = file1.data.map(row => row.id);
        const file2Ids = file2.data.map(row => row.id);
        const commonIds = _.intersection(file1Ids, file2Ids);
        
        for (const id of commonIds) {
          const file1Row = file1.data.find(row => row.id === id);
          const file2Row = file2.data.find(row => row.id === id);
          
          if (file1Row && file2Row) {
            const text1 = file1Row.text?.toString() || '';
            const text2 = file2Row.text?.toString() || '';
            
            const wordsMatch = _.isEqual(
              _.countBy(text1.split(' ')),
              _.countBy(text2.split(' '))
            );
            
            const textsDifferent = text1 !== text2;
            
            comparisonData.push({
              id,
              file1Text: text1,
              file2Text: text2,
              wordsMatch,
              textsDifferent
            });
          }
        }
        
        comparison = {
          file1Name: file1.name,
          file2Name: file2.name,
          data: comparisonData,
          differentTexts: comparisonData.filter(item => item.textsDifferent).length,
          sameWords: comparisonData.filter(item => item.wordsMatch).length
        };
      }
      
      // Calculate perplexity scores for each file
      const perplexityScores = await Promise.all(
        selectedFiles.map(async (file) => {
          const scores = await Promise.all(
            file.data.map(async (row) => {
              const text = row.text?.toString() || '';
              const perplexity = await calculatePerplexity(text);
              
              return {
                id: row.id,
                text,
                perplexity
              };
            })
          );
          
          // Calculate average perplexity
          const avgPerplexity = _.mean(scores.map(s => s.perplexity));
          
          // Create distribution buckets for histogram
          const perplexityValues = scores.map(s => s.perplexity);
          const min = Math.floor(_.min(perplexityValues) || 0);
          const max = Math.ceil(_.max(perplexityValues) || 30);
          const range = max - min;
          const bucketSize = range / 10; // 10 buckets
          
          const buckets = _.range(min, max + bucketSize, bucketSize);
          const distribution = buckets.map(bucket => ({
            bucket,
            count: perplexityValues.filter(
              p => p >= bucket && p < bucket + bucketSize
            ).length
          }));
          
          return {
            name: file.name,
            avgPerplexity,
            scores,
            distribution
          };
        })
      );
      
      // Find best texts (lowest perplexity) per ID across all files
      const allScores = _.flatten(
        perplexityScores.map(file => 
          file.scores.map(score => ({
            ...score,
            source: file.name
          }))
        )
      );
      
      const uniqueIds = _.uniq(allScores.map(score => score.id));
      
      const bestTexts = uniqueIds.map(id => {
        const scoresForId = allScores.filter(score => score.id === id);
        const bestScore = _.minBy(scoresForId, 'perplexity');
        return bestScore;
      }).filter(Boolean);
      
      // Calculate common IDs across all files
      const allIds = selectedFiles.map(file => 
        file.data.map(row => row.id.toString())
      );
      
      const commonIds = _.intersection(...allIds);
      const totalUniqueIds = _.union(...allIds).length;
      
      // Set analysis result
      setAnalysisResult({
        fileStats,
        comparison,
        commonIds: commonIds.length,
        totalUniqueIds,
        perplexityScores,
        bestTexts
      });
      
      setActiveTab('analysis');
      setLoading(false);
    } catch (err: any) {
      setError(`Error analyzing files: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Santa 2024 Perplexity Analyzer</h1>
            <p className="text-sm opacity-80">Analyze and visualize submission files for the Kaggle competition</p>
          </div>
          <Image
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            className="dark:invert"
            priority
          />
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto p-4 mb-12">
        {/* Navigation tabs */}
        <div className="flex border-b mb-6">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-4 mr-2 ${activeTab === 'upload' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          >
            Upload Files
          </button>
          <button 
            onClick={() => setActiveTab('analysis')}
            className={`py-2 px-4 mr-2 ${activeTab === 'analysis' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
            disabled={!analysisResult}
          >
            Analysis
          </button>
        </div>
        
        {/* Error display */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-sm underline mt-1"
            >
              Dismiss
            </button>
          </div>
        )}
        
        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center items-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3">Processing...</span>
          </div>
        )}
        
        {/* Upload tab */}
        {activeTab === 'upload' && !loading && (
          <div>
            {/* API Options */}
            <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 mb-6">
              <h2 className="text-lg font-medium mb-4">Calculation Options</h2>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="use-api"
                  checked={useRemoteApi}
                  onChange={(e) => setUseRemoteApi(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="use-api">
                  Use Python API for perplexity calculation (if unchecked, will use dummy scores)
                </label>
              </div>
            </div>
            
            {/* File uploader */}
            <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 mb-6">
              <h2 className="text-lg font-medium mb-4">Upload Submission Files</h2>
              <p className="text-gray-600 mb-4">
                Upload CSV files containing submission data with "id" and "text" columns.
              </p>
              
              <label className="block w-full border-2 border-dashed border-gray-300 p-8 text-center rounded-md cursor-pointer hover:border-blue-400 transition">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".csv"
                />
                <span className="text-gray-500">
                  Drag & drop CSV files here or click to browse
                </span>
              </label>
            </div>
            
            {/* Files list */}
            {files.length > 0 && (
              <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 mb-6">
                <h2 className="text-lg font-medium mb-4">Uploaded Files</h2>
                
                <ul className="divide-y divide-gray-200">
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
                        <label htmlFor={`file-${file.id}`} className={`${!file.isValid ? 'text-gray-400' : ''}`}>
                          {file.name}
                          <span className="text-xs text-gray-500 ml-2">
                            ({file.data.length} rows)
                          </span>
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <span className={`text-xs px-2 py-1 rounded-full mr-3 ${file.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {file.isValid ? 'Valid' : 'Invalid Format'}
                        </span>
                        
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={analyzeFiles}
                    disabled={selectedFileIds.length === 0}
                    className={`px-4 py-2 rounded-md ${
                      selectedFileIds.length === 0
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Analyze Selected Files
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Analysis tab */}
        {activeTab === 'analysis' && analysisResult && !loading && (
          <div>
            {/* Toggle text display */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowTextDetails(!showTextDetails)}
                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                {showTextDetails ? 'Hide Text Details' : 'Show Text Details'}
              </button>
            </div>
            
            {/* Basic file statistics */}
            <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 mb-6">
              <h2 className="text-lg font-medium mb-4">File Statistics</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File Name
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rows
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Words
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Min Words
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Max Words
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Perplexity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analysisResult.fileStats.map((stats, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {stats.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stats.rowCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stats.avgWordCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stats.minWordCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stats.maxWordCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {analysisResult.perplexityScores[index]?.avgPerplexity.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">ID Coverage: </span>
                  {analysisResult.commonIds} common IDs across all files
                  ({((analysisResult.commonIds / analysisResult.totalUniqueIds) * 100).toFixed(1)}% of {analysisResult.totalUniqueIds} total unique IDs)
                </p>
              </div>
            </div>
            
            {/* Perplexity score visualization */}
            <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 mb-6">
              <h2 className="text-lg font-medium mb-4">Perplexity Score Analysis</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Average scores */}
                <div>
                  <h3 className="text-md font-medium mb-3">Average Perplexity Scores</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analysisResult.perplexityScores.map(item => ({
                          name: item.name.substring(0, 20) + (item.name.length > 20 ? '...' : ''),
                          avgPerplexity: item.avgPerplexity
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                        <YAxis label={{ value: 'Perplexity (Lower is Better)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}`, 'Avg Perplexity']} />
                        <Bar dataKey="avgPerplexity" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Score distribution */}
                <div>
                  <h3 className="text-md font-medium mb-3">Score Distribution</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="bucket" 
                          type="number" 
                          domain={['dataMin', 'dataMax']} 
                          label={{ value: 'Perplexity Score', position: 'bottom' }}
                        />
                        <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        {analysisResult.perplexityScores.map((file, index) => (
                          <Line
                            key={index}
                            data={file.distribution}
                            type="monotone"
                            dataKey="count"
                            name={file.name.substring(0, 15) + (file.name.length > 15 ? '...' : '')}
                            stroke={`hsl(${index * 137.5 % 360}, 70%, 50%)`}
                            activeDot={{ r: 8 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-md font-medium mb-3">Score Comparison by Text ID</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid />
                      <XAxis 
                        type="number" 
                        dataKey="id" 
                        name="Text ID" 
                        label={{ value: 'Text ID', position: 'bottom' }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="perplexity" 
                        name="Perplexity"
                        label={{ value: 'Perplexity Score', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border border-gray-200 shadow-sm">
                                <p className="font-medium">{`ID: ${data.id}`}</p>
                                <p>{`Perplexity: ${data.perplexity.toFixed(2)}`}</p>
                                {showTextDetails && (
                                  <p className="mt-2 text-xs max-w-xs overflow-hidden">
                                    <span className="font-medium">Text: </span>
                                    {data.text}
                                  </p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      {analysisResult.perplexityScores.map((file, index) => (
                        <Scatter 
                          key={index} 
                          name={file.name.substring(0, 15) + (file.name.length > 15 ? '...' : '')}
                          data={file.scores} 
                          fill={`hsl(${index * 137.5 % 360}, 70%, 50%)`}
                        />
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Text analysis */}
            {showTextDetails && (
              <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 mb-6">
                <h2 className="text-lg font-medium mb-4">Text Analysis</h2>
                
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-3">Best Performing Texts</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Text
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Perplexity
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Source
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analysisResult.bestTexts?.slice(0, 10).map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {item.id}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                              {item.text}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.perplexity.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.source}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* File comparison */}
                {analysisResult.comparison && (
                  <div>
                    <h3 className="text-md font-medium mb-3">Text Comparison</h3>
                    
                    <div className="p-4 bg-yellow-50 rounded-md mb-4">
                      <p className="text-sm">
                        <span className="font-medium">Comparing: </span>
                        {analysisResult.comparison.file1Name} vs {analysisResult.comparison.file2Name}
                      </p>
                      <p className="text-sm mt-1">
                        <span className="font-medium">Different text arrangements: </span>
                        {analysisResult.comparison.differentTexts} rows
                        ({((analysisResult.comparison.differentTexts / analysisResult.comparison.data.length) * 100).toFixed(1)}% of total)
                      </p>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ID
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {analysisResult.comparison.file1Name}
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {analysisResult.comparison.file2Name}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {analysisResult.comparison.data
                            .filter(item => item.textsDifferent)
                            .slice(0, 5)
                            .map((item, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  {item.id}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                                  {item.file1Text}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                                  {item.file2Text}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-100 p-4 text-center text-gray-600 text-sm mt-8">
        <p>Santa 2024 Perplexity Analyzer - Created for Kaggle Competition Analysis</p>
        
        <div className="mt-4 flex justify-center gap-6">
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://www.kaggle.com/competitions/santa-2024"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Kaggle Competition</span>
          </a>
          
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://nextjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Built with Next.js</span>
          </a>
        </div>
      </footer>
    </div>
  );
}