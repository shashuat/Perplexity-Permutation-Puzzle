// components/analysis/PerplexityCharts.tsx
import { PerplexityScore } from "@/types/types";
import Card from "@/components/ui/Card";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter 
} from "recharts";

interface PerplexityChartsProps {
  perplexityScores: PerplexityScore[];
  showTextDetails: boolean;
}

export default function PerplexityCharts({
  perplexityScores,
  showTextDetails
}: PerplexityChartsProps) {
  return (
    <Card title="Perplexity Score Analysis">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average scores */}
        <div>
          <h3 className="text-md font-medium mb-3">Average Perplexity Scores</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={perplexityScores.map(item => ({
                  name: item.name.substring(0, 20) + (item.name.length > 20 ? '...' : ''),
                  avgPerplexity: item.avgPerplexity
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60} 
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  label={{ 
                    value: 'Perplexity (Lower is Better)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: 'currentColor' }
                  }} 
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip 
                  formatter={(value) => [`${Number(value).toFixed(2)}`, 'Avg Perplexity']}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    color: '#333',
                    border: '1px solid #ccc'
                  }}
                />
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
                  label={{ 
                    value: 'Perplexity Score', 
                    position: 'bottom',
                    style: { fill: 'currentColor' }
                  }}
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  label={{ 
                    value: 'Count', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: 'currentColor' }
                  }}
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    color: '#333',
                    border: '1px solid #ccc'
                  }}
                />
                <Legend />
                {perplexityScores.map((file, index) => (
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
                label={{ 
                  value: 'Text ID', 
                  position: 'bottom',
                  style: { fill: 'currentColor' }
                }}
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                type="number" 
                dataKey="perplexity" 
                name="Perplexity"
                label={{ 
                  value: 'Perplexity Score', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: 'currentColor' }
                }}
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
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
              {perplexityScores.map((file, index) => (
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
    </Card>
  );
}