import { BuilderComponent as BuilderComponentBase, useIsPreviewing, BuilderContent as BuilderContentType } from '@builder.io/react';
import { BUILDER_API_KEY, builder } from '@/lib/builder';
import { useEffect, useState } from 'react';

interface BuilderComponentProps {
  model: string;
  content?: any; // Using any to avoid type compatibility issues
  apiKey?: string;
  customClassName?: string;
}

export function BuilderComponent({ 
  model, 
  content, 
  apiKey = BUILDER_API_KEY,
  customClassName 
}: BuilderComponentProps) {
  const isPreviewing = useIsPreviewing();
  const [builderContent, setBuilderContent] = useState<any>(content || null);

  useEffect(() => {
    async function fetchContent() {
      const content = await builder
        .get(model, {
          apiKey,
          // Use a string value for cachebust instead of number
          cachebust: isPreviewing ? Date.now().toString() : undefined,
        })
        .promise();

      if (content) {
        setBuilderContent(content);
      }
    }

    if (!content) {
      fetchContent();
    }
  }, [model, apiKey, content, isPreviewing]);

  // If no content was found and not in preview mode, don't render anything
  if (!builderContent && !isPreviewing) {
    return null;
  }

  return (
    <div className={customClassName}>
      <BuilderComponentBase
        model={model}
        content={builderContent || undefined}
        apiKey={apiKey}
      />
    </div>
  );
}
