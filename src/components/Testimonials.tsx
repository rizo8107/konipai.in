
import { Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Emily T.',
    location: 'New York, NY',
    text: 'I use my Konipai tote every day for work. It\'s spacious enough for my laptop and essentials, and I love how the canvas has worn in beautifully over time.',
    rating: 5,
    product: 'Classic Canvas Tote'
  },
  {
    id: 2,
    name: 'Michael R.',
    location: 'Portland, OR',
    text: 'The quality of these totes is outstanding. I bought one for farmers market shopping and it\'s held up perfectly even when loaded with heavy produce.',
    rating: 5,
    product: 'Market Canvas Tote'
  },
  {
    id: 3,
    name: 'Sarah L.',
    location: 'Austin, TX',
    text: 'I appreciate the sustainable materials and ethical manufacturing. Plus, I get compliments on my mint tote everywhere I go!',
    rating: 4,
    product: 'Classic Canvas Tote'
  }
];

const Testimonials = () => {
  return (
    <section className="py-16 bg-konipai-lightBeige border-b border-gray-200">
      <div className="konipai-container">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={16} 
                    className={i < testimonial.rating ? 'fill-konipai-black text-konipai-black' : 'text-gray-300'} 
                  />
                ))}
              </div>
              <p className="mb-4 text-sm italic">"{testimonial.text}"</p>
              <div>
                <p className="font-medium">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.location}</p>
                <p className="text-sm mt-1">on {testimonial.product}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
