import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send this data to your backend
    console.log("Form submitted:", formData);
    toast.success("Message sent successfully! We'll get back to you soon.");
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <div className="konipai-container py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Contact Information */}
        <div>
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Reach Out to Us</h2>
            <p className="mb-6 text-muted-foreground">
              We're here to help! Feel free to reach out with any questions, concerns, or feedback.
              Our team is dedicated to providing you with the best possible experience.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-medium">Address</h3>
                  <address className="not-italic text-muted-foreground">
                    Konipai Headquarters <br />
                    123 Tote Lane <br />
                    Mumbai, India 400001
                  </address>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-muted-foreground">support@konipai.in</p>
                  <p className="text-muted-foreground">info@konipai.in</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-medium">Phone</h3>
                  <p className="text-muted-foreground">+91 (123) 456-7890</p>
                  <p className="text-muted-foreground">Customer Service: +91 (123) 456-7891</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-medium mb-2">Business Hours</h3>
              <table className="w-full text-muted-foreground">
                <tbody>
                  <tr>
                    <td className="py-1">Monday - Friday:</td>
                    <td className="py-1">9:00 AM - 6:00 PM IST</td>
                  </tr>
                  <tr>
                    <td className="py-1">Saturday:</td>
                    <td className="py-1">10:00 AM - 4:00 PM IST</td>
                  </tr>
                  <tr>
                    <td className="py-1">Sunday:</td>
                    <td className="py-1">Closed</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Contact Form */}
        <div>
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject" 
                  name="subject" 
                  value={formData.subject} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  name="message" 
                  rows={5} 
                  value={formData.message} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <Button type="submit" className="w-full">Send Message</Button>
            </form>
          </Card>
        </div>
      </div>
      
      {/* Map or Additional Information */}
      <div className="mt-12 max-w-5xl mx-auto">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Find Us</h2>
          <div className="h-64 bg-muted rounded-md flex items-center justify-center">
            {/* Replace with an actual map component or iframe */}
            <p className="text-muted-foreground">Map would be displayed here</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ContactUs; 