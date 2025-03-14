
import { useState } from 'react';
import { toast } from 'sonner';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    // In a real app, this would call an API to submit the email
    console.log('Newsletter subscription for:', email);
    toast.success('Thanks for subscribing!');
    setEmail('');
  };
  
  return (
    <section className="py-16 bg-konipai-beige border-b border-gray-200">
      <div className="konipai-container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-lg mb-6">
            Subscribe to our newsletter for exclusive offers, new product launches, and sustainable living tips.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-grow px-4 py-3 border border-konipai-black/20 focus:outline-none focus:border-konipai-black"
              aria-label="Email address"
            />
            <button type="submit" className="konipai-btn whitespace-nowrap">
              Subscribe
            </button>
          </form>
          
          <p className="text-sm mt-4 text-gray-500">
            We respect your privacy and will never share your information.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
