import { Component, type ErrorInfo, type ReactNode } from "react";
import ErrorPage from "@/components/system/error-page";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          code={500}
          message="Произошла ошибка. Попробуйте обновить страницу."
          actions={<Button onClick={this.handleReload}>Перезагрузить</Button>}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
