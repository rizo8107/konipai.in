import { BuilderComponent } from './BuilderComponent';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BuilderContent } from '@builder.io/react';
import { BUILDER_API_KEY, builder } from '@/lib/builder';

// Import the component registry to make components available to Builder.io
import '@/lib/builder-registry';

interface BuilderPageProps {
  model?: string;
  fallback?: React.ReactNode;
}

export function BuilderPage({ model = 'page', fallback }: BuilderPageProps) {
  const location = useLocation();
  const [content, setContent] = useState<BuilderContent | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Remove leading slash and query parameters for Builder.io URL matching
    const path = location.pathname.substring(1) || 'home';
    
    async function fetchContent() {
      setLoading(true);
      try {
        const content = await builder.get(model, {
          apiKey: BUILDER_API_KEY,
          userAttributes: {
            urlPath: path,
          },
        }).promise();
        
        setContent(content);
      } catch (error) {
        console.error('Error fetching Builder.io content:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, [location.pathname, model]);

  // Show loading state
  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // If no content is found, show the fallback
  if (!content && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="builder-page">
      <BuilderComponent model={model} content={content} />
    </div>
  );
}
