
import { Leaf, Recycle, HeartHandshake } from 'lucide-react';

const Sustainability = () => {
  return (
    <section className="py-16 bg-konipai-mint/20 border-y border-gray-200">
      <div className="konipai-container">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Commitment to Sustainability</h2>
          <p className="text-lg">
            At Konipai, we believe in creating products that are kind to the planet. Each bag is crafted with sustainable materials and ethical practices.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="bg-konipai-mint rounded-full p-4 mb-4">
              <Leaf size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-medium mb-2">Organic Materials</h3>
            <p>
              We use 100% organic cotton canvas that's grown without harmful pesticides or synthetic fertilizers.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="bg-konipai-mint rounded-full p-4 mb-4">
              <Recycle size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-medium mb-2">Low Waste Production</h3>
            <p>
              Our manufacturing process minimizes waste and uses recycled water and renewable energy whenever possible.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="bg-konipai-mint rounded-full p-4 mb-4">
              <HeartHandshake size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-medium mb-2">Fair Labor Practices</h3>
            <p>
              We partner with ethical factories that provide fair wages and safe working conditions for all employees.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Sustainability;
