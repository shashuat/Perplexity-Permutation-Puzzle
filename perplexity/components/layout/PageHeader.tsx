// components/layout/PageHeader.tsx
import Image from "next/image";

export default function PageHeader() {
  return (
    <header className="bg-blue-600 dark:bg-blue-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Santa 2024 Perplexity Analyzer</h1>
          <p className="text-sm opacity-80">
            Analyze and visualize submission files for the Kaggle competition
          </p>
        </div>
        <Image
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          className="invert"
          priority
        />
      </div>
    </header>
  );
}