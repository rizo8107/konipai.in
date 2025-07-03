import { useEffect, useState } from 'react';
import { BuilderComponent } from '@/components/BuilderComponent';
import { builder } from '@/lib/builder';
import { BUILDER_API_KEY } from '@/lib/builder';

// Import the component registry to make components available to Builder.io
import '@/lib/builder-registry';

export default function BuilderExample() {
  const [builderContentJson, setBuilderContentJson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch content from Builder.io for this specific model
    async function fetchContent() {
      try {
        const content = await builder
          .get('example-section', {
            apiKey: BUILDER_API_KEY,
            // You can add targeting attributes here
            userAttributes: {
              // Example: device type, user role, etc.
              device: window.innerWidth > 768 ? 'desktop' : 'mobile',
            }
          })
          .promise();

        setBuilderContentJson(content);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching Builder.io content:', error);
        setLoading(false);
      }
    }

    fetchContent();
  }, []);

  // Show loading state while content is being fetched
  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Builder.io Example Page</h1>
      
      {/* Static content that's part of your React app */}
      <div className="mb-8 p-6 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-4">This is your static React content</h2>
        <p className="text-muted-foreground">
          This section is hardcoded in your React component and won't change with Builder.io.
        </p>
      </div>
      
      {/* Builder.io editable section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Builder.io Editable Section:</h2>
        <div className="border-2 border-dashed border-primary/30 rounded-lg p-1">
          {builderContentJson ? (
            <BuilderComponent 
              model="example-section" 
              content={builderContentJson} 
              customClassName="p-4"
            />
          ) : (
            <div className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No Builder.io content found</h3>
              <p className="text-muted-foreground mb-4">
                Create content for the "example-section" model in your Builder.io account to see it here.
              </p>
              <a 
                href="https://builder.io/content" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Go to Builder.io to create content
              </a>
            </div>
          )}
        </div>
      </div>
      
      {/* More static content */}
      <div className="p-6 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-4">More static content</h2>
        <p className="text-muted-foreground">
          You can mix and match static React components with Builder.io editable sections.
        </p>
      </div>
    </div>
  );
}
