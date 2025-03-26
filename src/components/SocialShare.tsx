import React from 'react';
import { Facebook, Twitter, Linkedin, Mail, Share2 } from 'lucide-react';
import { createSocialSharingUrl } from '@/lib/generateUtmUrl';
import { Button } from '@/components/ui/button';
import { trackButtonClick } from '@/lib/analytics';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  campaign?: string;
  className?: string;
  iconSize?: number;
  showLabel?: boolean;
}

/**
 * Social sharing component with UTM tracking
 */
export const SocialShare = ({
  url,
  title,
  description = '',
  campaign = 'product_share',
  className = '',
  iconSize = 20,
  showLabel = false
}: SocialShareProps) => {
  // Generate social sharing URLs with UTM parameters
  const facebookUrl = createSocialSharingUrl(url, 'facebook', campaign, 'share_button');
  const twitterUrl = createSocialSharingUrl(url, 'twitter', campaign, 'share_button');
  const linkedinUrl = createSocialSharingUrl(url, 'linkedin', campaign, 'share_button');
  
  const shareViaFacebook = (e: React.MouseEvent) => {
    e.preventDefault();
    trackButtonClick('share_facebook', 'Share on Facebook', window.location.pathname);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(facebookUrl)}`, '_blank', 'width=600,height=400');
  };
  
  const shareViaTwitter = (e: React.MouseEvent) => {
    e.preventDefault();
    trackButtonClick('share_twitter', 'Share on Twitter', window.location.pathname);
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(twitterUrl)}&text=${encodeURIComponent(title)}`, '_blank', 'width=600,height=400');
  };
  
  const shareViaLinkedin = (e: React.MouseEvent) => {
    e.preventDefault();
    trackButtonClick('share_linkedin', 'Share on LinkedIn', window.location.pathname);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(linkedinUrl)}`, '_blank', 'width=600,height=400');
  };
  
  const shareViaEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    trackButtonClick('share_email', 'Share via Email', window.location.pathname);
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`;
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && <span className="text-sm font-medium mr-2">Share:</span>}
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={shareViaFacebook}
        className="rounded-full hover:bg-blue-50 hover:text-blue-600"
        title="Share on Facebook"
      >
        <Facebook size={iconSize} />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={shareViaTwitter}
        className="rounded-full hover:bg-blue-50 hover:text-sky-500"
        title="Share on Twitter"
      >
        <Twitter size={iconSize} />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={shareViaLinkedin}
        className="rounded-full hover:bg-blue-50 hover:text-blue-700"
        title="Share on LinkedIn"
      >
        <Linkedin size={iconSize} />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={shareViaEmail}
        className="rounded-full hover:bg-amber-50 hover:text-amber-600"
        title="Share via Email"
      >
        <Mail size={iconSize} />
      </Button>
    </div>
  );
};

export default SocialShare;

 