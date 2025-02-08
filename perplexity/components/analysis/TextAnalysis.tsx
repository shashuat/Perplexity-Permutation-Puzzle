// components/analysis/TextAnalysis.tsx
import { BestText, FileComparison } from "@/types/types";
import Card from "@/components/ui/Card";

interface TextAnalysisProps {
  bestTexts?: BestText[];
  comparison: FileComparison | null;
}

export default function TextAnalysis({ bestTexts, comparison }: TextAnalysisProps) {
  return (
    <Card title="Text Analysis">
      {/* Best performing texts */}
      {bestTexts && bestTexts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium mb-3">Best Performing Texts</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Text
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Perplexity
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {bestTexts.slice(0, 10).map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-md">
                      {item.text}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.perplexity.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* File comparison */}
      {comparison && (
        <div>
          <h3 className="text-md font-medium mb-3">Text Comparison</h3>
          
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <span className="font-medium">Comparing: </span>
              {comparison.file1Name} vs {comparison.file2Name}
            </p>
            <p className="text-sm mt-1 text-yellow-800 dark:text-yellow-300">
              <span className="font-medium">Different text arrangements: </span>
              {comparison.differentTexts} rows
              ({((comparison.differentTexts / comparison.data.length) * 100).toFixed(1)}% of total)
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {comparison.file1Name}
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {comparison.file2Name}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {comparison.data
                  .filter(item => item.textsDifferent)
                  .slice(0, 5)
                  .map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                        {item.file1Text}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                        {item.file2Text}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}