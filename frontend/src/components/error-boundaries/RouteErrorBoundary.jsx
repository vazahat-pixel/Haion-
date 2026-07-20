import { Component } from 'react';
import { ErrorState } from '@/components/feedback/ErrorState';

export class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Something went wrong',
    };
  }

  componentDidCatch(error, info) {
    console.error(`[RouteErrorBoundary:${this.props.panel || 'app'}]`, error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    // Reset when navigating to another route so one bad page doesn't blank the rest.
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <ErrorState
            message={this.state.errorMessage || `Error in ${this.props.panel || 'application'}`}
            onRetry={() => this.setState({ hasError: false, errorMessage: '' })}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
