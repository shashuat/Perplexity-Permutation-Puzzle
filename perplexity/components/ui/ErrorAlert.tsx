// components/ui/ErrorAlert.tsx

interface ErrorAlertProps {
    error: string;
    onDismiss: () => void;
  }
  
  export default function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
    return (
      <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-4" role="alert">
        <p>{error}</p>
        <button 
          onClick={onDismiss}
          className="text-sm underline mt-1"
        >
          Dismiss
        </button>
      </div>
    );
  }