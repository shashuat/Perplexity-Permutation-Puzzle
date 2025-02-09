// components/upload/ApiToggle.tsx
import { Dispatch, SetStateAction } from 'react';
import Card from "@/components/ui/Card";

interface ApiToggleProps {
  useRemoteApi: boolean;
  setUseRemoteApi: Dispatch<SetStateAction<boolean>>;
}

export default function ApiToggle({ useRemoteApi, setUseRemoteApi }: ApiToggleProps) {
  return (
    <Card title="Calculation Options">
      <div className="flex items-center">
        <input
          type="checkbox"
          id="use-api"
          checked={useRemoteApi}
          onChange={(e) => setUseRemoteApi(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="use-api" className="text-gray-700 dark:text-gray-300">
          Use Python API for perplexity calculation (if unchecked, will use dummy scores)
        </label>
      </div>
    </Card>
  );
}