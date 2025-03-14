
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="konipai-container py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Our Story</h1>
      
      <div className="max-w-3xl mx-auto mb-16">
        <p className="text-lg mb-6">
          Konipai was founded in 2021 with a simple mission: to create beautiful, functional tote bags 
          that don't compromise on sustainability or style.
        </p>
        <p className="text-lg mb-6">
          Our journey began when our founder, Kai, couldn't find a tote bag that was both 
          environmentally friendly and stylish enough for everyday use. After months of research 
          and development, Konipai was born.
        </p>
        <p className="text-lg">
          Today, we continue to craft each bag with care using organic materials and ethical 
          production methods. We believe that small choices make a big difference, and we're 
          proud to be part of your sustainable lifestyle journey.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div>
          <img 
            src="/placeholder.svg" 
            alt="Konipai workshop"
            className="w-full h-auto"
          />
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="text-2xl font-bold mb-4">Handcrafted with Care</h2>
          <p className="mb-4">
            Each Konipai tote is made by skilled artisans who take pride in their craft. 
            We work closely with our production partners to ensure quality at every step.
          </p>
          <p>
            From pattern cutting to final stitching, we pay attention to every detail to 
            create bags that are not only beautiful but built to last for years.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div className="flex flex-col justify-center md:order-1">
          <h2 className="text-2xl font-bold mb-4">Sustainable by Design</h2>
          <p className="mb-4">
            Sustainability isn't just a buzzword for us—it's at the core of everything we do. 
            We source organic cotton from certified suppliers and use low-impact dyes to minimize 
            our environmental footprint.
          </p>
          <p>
            Our packaging is plastic-free and made from recycled materials, because we believe 
            responsibility extends beyond the product itself.
          </p>
        </div>
        <div className="md:order-2">
          <img 
            src="/placeholder.svg" 
            alt="Sustainable materials"
            className="w-full h-auto"
          />
        </div>
      </div>
      
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Join Our Journey</h2>
        <p className="mb-6">
          We're just getting started, and we're excited to have you along for the ride. 
          Every purchase supports our mission of creating beautiful, sustainable products 
          that make a positive impact.
        </p>
        <Link to="/shop" className="konipai-btn">
          Shop Our Collection
        </Link>
      </div>
    </div>
  );
};

export default About;
