import { toast } from "sonner";

export function handleError(error: any, context: string = "An error occurred") {
  console.error(`[${context}]`, error);
  
  const message = error?.message || error?. error_description || context;
  
  toast.error(message, {
    duration: 5000,
    action: {
      label: "Dismiss",
      onClick: () => {},
    },
  });
}

export function handleSuccess(message: string) {
  toast.success(message, {
    duration: 3000,
  });
}
