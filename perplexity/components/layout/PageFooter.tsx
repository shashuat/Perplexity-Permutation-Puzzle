// components/layout/PageFooter.tsx

export default function PageFooter() {
    return (
      <footer className="bg-gray-100 dark:bg-gray-800 p-4 text-center text-gray-600 dark:text-gray-300 text-sm mt-8">
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
    );
  }